package media

import (
	"context"
	"fmt"
	"net/url"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

// StorageConfig holds object storage configuration.
type StorageConfig struct {
	Endpoint        string
	Region          string
	AccessKeyID     string
	SecretAccessKey string
	Bucket          string
	UsePathStyle    bool // For MinIO/local S3-compatible storage
}

// Client wraps S3 client for media operations.
type Client struct {
	s3Client *s3.Client
	bucket   string
}

// NewClient creates a new media storage client.
func NewClient(cfg StorageConfig) (*Client, error) {
	// Configure custom endpoint resolver for MinIO/S3-compatible storage
	customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		if cfg.Endpoint != "" {
			return aws.Endpoint{
				URL:               cfg.Endpoint,
				HostnameImmutable: true,
			}, nil
		}
		return aws.Endpoint{}, &aws.EndpointNotFoundError{}
	})

	awsCfg, err := config.LoadDefaultConfig(context.Background(),
		config.WithRegion(cfg.Region),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			cfg.AccessKeyID,
			cfg.SecretAccessKey,
			"",
		)),
		config.WithEndpointResolverWithOptions(customResolver),
	)
	if err != nil {
		return nil, err
	}

	s3Client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.UsePathStyle = cfg.UsePathStyle
	})

	return &Client{
		s3Client: s3Client,
		bucket:   cfg.Bucket,
	}, nil
}

// UploadURLRequest holds parameters for generating upload URL.
type UploadURLRequest struct {
	Folder      string // e.g., "providers", "items"
	ContentType string
	FileName    string
}

// UploadURLResponse contains the pre-signed URL and final object key.
type UploadURLResponse struct {
	UploadURL string `json:"upload_url"`
	ObjectKey string `json:"object_key"`
	ExpiresIn int    `json:"expires_in_seconds"`
}

// GenerateUploadURL creates a pre-signed PUT URL for direct client uploads.
func (c *Client) GenerateUploadURL(ctx context.Context, req UploadURLRequest) (*UploadURLResponse, error) {
	// Generate unique object key
	objectKey := fmt.Sprintf("%s/%s-%s", req.Folder, uuid.New().String(), req.FileName)

	presignClient := s3.NewPresignClient(c.s3Client)

	presignedReq, err := presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(c.bucket),
		Key:         aws.String(objectKey),
		ContentType: aws.String(req.ContentType),
	}, s3.WithPresignExpires(15*time.Minute))
	if err != nil {
		return nil, err
	}

	return &UploadURLResponse{
		UploadURL: presignedReq.URL,
		ObjectKey: objectKey,
		ExpiresIn: 900, // 15 minutes
	}, nil
}

// GetURLRequest holds parameters for generating download URL.
type GetURLRequest struct {
	ObjectKey string
}

// GetURLResponse contains the pre-signed GET URL.
type GetURLResponse struct {
	DownloadURL string `json:"download_url"`
	ExpiresIn   int    `json:"expires_in_seconds"`
}

// GenerateGetURL creates a pre-signed GET URL for downloading/viewing media.
func (c *Client) GenerateGetURL(ctx context.Context, req GetURLRequest) (*GetURLResponse, error) {
	presignClient := s3.NewPresignClient(c.s3Client)

	presignedReq, err := presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(req.ObjectKey),
	}, s3.WithPresignExpires(1*time.Hour))
	if err != nil {
		return nil, err
	}

	return &GetURLResponse{
		DownloadURL: presignedReq.URL,
		ExpiresIn:   3600, // 1 hour
	}, nil
}

// DeleteObject removes an object from storage.
func (c *Client) DeleteObject(ctx context.Context, objectKey string) error {
	_, err := c.s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(objectKey),
	})
	return err
}

// GetPublicURL returns a public URL for an object (if bucket is public).
func (c *Client) GetPublicURL(objectKey string, endpoint string) string {
	return fmt.Sprintf("%s/%s/%s", endpoint, c.bucket, url.PathEscape(objectKey))
}

// EnsureBucket creates the bucket if it doesn't exist.
func (c *Client) EnsureBucket(ctx context.Context) error {
	_, err := c.s3Client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: aws.String(c.bucket),
	})
	if err == nil {
		return nil // Bucket exists
	}

	_, err = c.s3Client.CreateBucket(ctx, &s3.CreateBucketInput{
		Bucket: aws.String(c.bucket),
	})
	return err
}
