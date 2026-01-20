package cdn

import (
	"fmt"
	"net/url"
	"os"
	"path"
	"strings"
)

// ============================================
// CDN SERVICE FOR MEDIA DELIVERY
// ============================================

// CDNService defines the interface for CDN operations
type CDNService interface {
	GetURL(objectKey string) string
	GetImageURL(objectKey string, width, height int, quality int) string
}

// ============================================
// CLOUDFLARE CDN (Free tier available)
// https://www.cloudflare.com/
// Free: Unlimited bandwidth, basic image optimization
// ============================================

// CloudflareCDN implements CDNService for Cloudflare
type CloudflareCDN struct {
	BaseURL     string // Your Cloudflare CDN URL or custom domain
	ZoneID      string
	AccountID   string
	ImageResize bool // Cloudflare Image Resizing (requires paid plan)
}

func NewCloudflareCDN(baseURL, zoneID, accountID string, imageResize bool) *CloudflareCDN {
	return &CloudflareCDN{
		BaseURL:     strings.TrimSuffix(baseURL, "/"),
		ZoneID:      zoneID,
		AccountID:   accountID,
		ImageResize: imageResize,
	}
}

func (c *CloudflareCDN) GetURL(objectKey string) string {
	return fmt.Sprintf("%s/%s", c.BaseURL, objectKey)
}

// GetImageURL returns optimized image URL
// Cloudflare Image Resizing format: /cdn-cgi/image/width=X,height=Y,quality=Q/path
func (c *CloudflareCDN) GetImageURL(objectKey string, width, height int, quality int) string {
	if !c.ImageResize {
		return c.GetURL(objectKey)
	}

	if quality == 0 {
		quality = 80
	}

	params := fmt.Sprintf("width=%d,height=%d,quality=%d,fit=cover", width, height, quality)
	return fmt.Sprintf("%s/cdn-cgi/image/%s/%s", c.BaseURL, params, objectKey)
}

// ============================================
// AWS CLOUDFRONT CDN
// https://aws.amazon.com/cloudfront/
// Free tier: 1 TB data transfer/month for first year
// ============================================

// CloudFrontCDN implements CDNService for AWS CloudFront
type CloudFrontCDN struct {
	DistributionDomain string // e.g., d1234567890.cloudfront.net
	SignedURLs         bool   // Whether to use signed URLs for private content
	KeyPairID          string
	PrivateKey         string
}

func NewCloudFrontCDN(distributionDomain string) *CloudFrontCDN {
	return &CloudFrontCDN{
		DistributionDomain: strings.TrimSuffix(distributionDomain, "/"),
	}
}

func (c *CloudFrontCDN) GetURL(objectKey string) string {
	return fmt.Sprintf("https://%s/%s", c.DistributionDomain, objectKey)
}

func (c *CloudFrontCDN) GetImageURL(objectKey string, width, height int, quality int) string {
	// CloudFront doesn't have built-in image optimization
	// You would need to use Lambda@Edge or a separate image service
	return c.GetURL(objectKey)
}

// ============================================
// BUNNY CDN (Very affordable)
// https://bunny.net/
// $0.01/GB, includes image optimization
// ============================================

// BunnyCDN implements CDNService for Bunny.net
type BunnyCDN struct {
	PullZoneURL   string // e.g., https://yourzone.b-cdn.net
	ImageOptimize bool
}

func NewBunnyCDN(pullZoneURL string, imageOptimize bool) *BunnyCDN {
	return &BunnyCDN{
		PullZoneURL:   strings.TrimSuffix(pullZoneURL, "/"),
		ImageOptimize: imageOptimize,
	}
}

func (b *BunnyCDN) GetURL(objectKey string) string {
	return fmt.Sprintf("%s/%s", b.PullZoneURL, objectKey)
}

// GetImageURL returns optimized image URL
// Bunny Optimizer format: ?width=X&height=Y&quality=Q
func (b *BunnyCDN) GetImageURL(objectKey string, width, height int, quality int) string {
	baseURL := b.GetURL(objectKey)
	if !b.ImageOptimize {
		return baseURL
	}

	if quality == 0 {
		quality = 80
	}

	return fmt.Sprintf("%s?width=%d&height=%d&quality=%d", baseURL, width, height, quality)
}

// ============================================
// IMAGEKIT CDN (Good free tier)
// https://imagekit.io/
// Free: 20GB bandwidth/month, real-time image optimization
// ============================================

// ImageKitCDN implements CDNService for ImageKit
type ImageKitCDN struct {
	URLEndpoint string // e.g., https://ik.imagekit.io/your_id
}

func NewImageKitCDN(urlEndpoint string) *ImageKitCDN {
	return &ImageKitCDN{
		URLEndpoint: strings.TrimSuffix(urlEndpoint, "/"),
	}
}

func (i *ImageKitCDN) GetURL(objectKey string) string {
	return fmt.Sprintf("%s/%s", i.URLEndpoint, objectKey)
}

// GetImageURL returns optimized image URL
// ImageKit format: /tr:w-X,h-Y,q-Q/path
func (i *ImageKitCDN) GetImageURL(objectKey string, width, height int, quality int) string {
	if quality == 0 {
		quality = 80
	}

	transform := fmt.Sprintf("tr:w-%d,h-%d,q-%d,fo-auto", width, height, quality)
	return fmt.Sprintf("%s/%s/%s", i.URLEndpoint, transform, objectKey)
}

// ============================================
// LOCAL/DIRECT CDN (Development)
// Serves directly from S3/MinIO
// ============================================

// DirectCDN serves files directly from storage (for development)
type DirectCDN struct {
	StorageURL string // e.g., http://localhost:9000/bucket
}

func NewDirectCDN(storageURL string) *DirectCDN {
	return &DirectCDN{
		StorageURL: strings.TrimSuffix(storageURL, "/"),
	}
}

func (d *DirectCDN) GetURL(objectKey string) string {
	return fmt.Sprintf("%s/%s", d.StorageURL, objectKey)
}

func (d *DirectCDN) GetImageURL(objectKey string, width, height int, quality int) string {
	// No optimization in direct mode
	return d.GetURL(objectKey)
}

// ============================================
// URL HELPERS
// ============================================

// MediaURLHelper provides convenient methods for generating media URLs
type MediaURLHelper struct {
	cdn CDNService
}

func NewMediaURLHelper(cdn CDNService) *MediaURLHelper {
	return &MediaURLHelper{cdn: cdn}
}

// GetAvatarURL returns optimized avatar image URL
func (m *MediaURLHelper) GetAvatarURL(objectKey string, size int) string {
	if objectKey == "" {
		return ""
	}
	return m.cdn.GetImageURL(objectKey, size, size, 85)
}

// GetThumbnailURL returns optimized thumbnail image URL
func (m *MediaURLHelper) GetThumbnailURL(objectKey string) string {
	if objectKey == "" {
		return ""
	}
	return m.cdn.GetImageURL(objectKey, 300, 200, 80)
}

// GetFullImageURL returns full-size optimized image URL
func (m *MediaURLHelper) GetFullImageURL(objectKey string) string {
	if objectKey == "" {
		return ""
	}
	return m.cdn.GetImageURL(objectKey, 1200, 0, 85)
}

// GetMenuItemImageURL returns optimized menu item image
func (m *MediaURLHelper) GetMenuItemImageURL(objectKey string) string {
	if objectKey == "" {
		return ""
	}
	return m.cdn.GetImageURL(objectKey, 400, 400, 80)
}

// ParseObjectKey extracts the object key from a full URL
func ParseObjectKey(fullURL string) string {
	if fullURL == "" {
		return ""
	}
	parsed, err := url.Parse(fullURL)
	if err != nil {
		return fullURL
	}
	return strings.TrimPrefix(parsed.Path, "/")
}

// GetExtension returns the file extension from an object key
func GetExtension(objectKey string) string {
	return strings.ToLower(path.Ext(objectKey))
}

// IsImage checks if the object is an image based on extension
func IsImage(objectKey string) bool {
	ext := GetExtension(objectKey)
	imageExts := map[string]bool{
		".jpg": true, ".jpeg": true, ".png": true,
		".gif": true, ".webp": true, ".avif": true,
	}
	return imageExts[ext]
}

// ============================================
// FACTORY FUNCTION
// ============================================

// NewCDNService creates the appropriate CDN service based on environment
func NewCDNService() CDNService {
	cdnType := os.Getenv("CDN_TYPE")

	switch cdnType {
	case "cloudflare":
		baseURL := os.Getenv("CLOUDFLARE_CDN_URL")
		zoneID := os.Getenv("CLOUDFLARE_ZONE_ID")
		accountID := os.Getenv("CLOUDFLARE_ACCOUNT_ID")
		imageResize := os.Getenv("CLOUDFLARE_IMAGE_RESIZE") == "true"
		if baseURL != "" {
			return NewCloudflareCDN(baseURL, zoneID, accountID, imageResize)
		}

	case "cloudfront":
		domain := os.Getenv("CLOUDFRONT_DOMAIN")
		if domain != "" {
			return NewCloudFrontCDN(domain)
		}

	case "bunny":
		pullZone := os.Getenv("BUNNY_PULLZONE_URL")
		imageOptimize := os.Getenv("BUNNY_IMAGE_OPTIMIZE") == "true"
		if pullZone != "" {
			return NewBunnyCDN(pullZone, imageOptimize)
		}

	case "imagekit":
		endpoint := os.Getenv("IMAGEKIT_URL_ENDPOINT")
		if endpoint != "" {
			return NewImageKitCDN(endpoint)
		}
	}

	// Default to direct storage URL for development
	storageURL := os.Getenv("S3_ENDPOINT")
	bucket := os.Getenv("S3_BUCKET")
	if storageURL == "" {
		storageURL = "http://localhost:9000"
	}
	if bucket == "" {
		bucket = "jain-food-media"
	}

	fmt.Println("⚠️  Using direct storage URL (CDN not configured)")
	return NewDirectCDN(fmt.Sprintf("%s/%s", storageURL, bucket))
}
