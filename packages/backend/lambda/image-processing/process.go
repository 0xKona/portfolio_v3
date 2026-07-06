package main

import (
	"bytes"
	"context"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/disintegration/imaging"
)

type Variant struct {
	Name    string
	Width   int // 0 means keep original dimensions
	Quality int // JPEG quality (1-100)
}

var variants = []Variant{
	{Name: "thumbnail", Width: 800, Quality: 80},
	{Name: "optimised", Width: 1200, Quality: 90},
	{Name: "original", Width: 0, Quality: 95},
}

// processImage downloads the raw image, generates JPEG variants, uploads them
// to processed/<projectId>/<imageId>-<variant>.jpg, and sets imageProcessed=true
// on the DynamoDB record.
func processImage(ctx context.Context, key string) error {
	projectId := extractProjectId(key)
	if projectId == "" {
		return fmt.Errorf("could not extract projectId from key: %s", key)
	}

	imageId := extractImageId(key)
	if imageId == "" {
		return fmt.Errorf("could not extract imageId from key: %s", key)
	}

	src, err := downloadImage(ctx, key)
	if err != nil {
		return fmt.Errorf("download failed: %w", err)
	}

	for _, v := range variants {
		resized := resize(src, v.Width)
		jpegData, err := encodeJPEG(resized, v.Quality)
		if err != nil {
			return fmt.Errorf("encode %s failed: %w", v.Name, err)
		}

		outputKey := fmt.Sprintf("processed/%s/%s-%s.jpg", projectId, imageId, v.Name)
		if err := upload(ctx, outputKey, jpegData); err != nil {
			return fmt.Errorf("upload %s failed: %w", v.Name, err)
		}
	}

	if err := setImageProcessed(ctx, projectId); err != nil {
		return fmt.Errorf("dynamodb update failed: %w", err)
	}

	return nil
}

// extractProjectId parses "raw/<projectId>/<imageId>.<ext>" → "<projectId>"
func extractProjectId(key string) string {
	parts := strings.Split(key, "/")
	if len(parts) >= 3 && parts[0] == "raw" {
		return parts[1]
	}
	return ""
}

// extractImageId parses "raw/<projectId>/<imageId>.<ext>" → "<imageId>"
func extractImageId(key string) string {
	parts := strings.Split(key, "/")
	if len(parts) < 3 {
		return ""
	}
	filename := parts[2] // e.g. "a1b2c3d4e5.png"
	dotIdx := strings.LastIndex(filename, ".")
	if dotIdx <= 0 {
		return ""
	}
	return filename[:dotIdx]
}

// downloadImage fetches the object from S3 and decodes it into an image.Image.
func downloadImage(ctx context.Context, key string) (image.Image, error) {
	result, err := s3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, err
	}
	defer result.Body.Close()

	data, err := io.ReadAll(result.Body)
	if err != nil {
		return nil, err
	}

	img, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, fmt.Errorf("image decode failed: %w", err)
	}
	return img, nil
}

// resize scales the image to the target width preserving aspect ratio.
// Width 0 keeps original dimensions.
func resize(img image.Image, width int) image.Image {
	if width == 0 {
		return img
	}
	return imaging.Resize(img, width, 0, imaging.Lanczos)
}

// encodeJPEG encodes an image to JPEG with the specified quality.
func encodeJPEG(img image.Image, quality int) ([]byte, error) {
	var buf bytes.Buffer
	err := imaging.Encode(&buf, img, imaging.JPEG, imaging.JPEGQuality(quality))
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// upload writes the encoded image to S3 with the correct content type.
func upload(ctx context.Context, key string, data []byte) error {
	_, err := s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(bucketName),
		Key:         aws.String(key),
		Body:        bytes.NewReader(data),
		ContentType: aws.String("image/jpeg"),
	})
	return err
}

// setImageProcessed sets imageProcessed=true on the project's DynamoDB record.
func setImageProcessed(ctx context.Context, projectId string) error {
	_, err := dbClient.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(tableName),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: fmt.Sprintf("PROJECT#%s", projectId)},
			"SK": &types.AttributeValueMemberS{Value: fmt.Sprintf("PROJECT#%s", projectId)},
		},
		UpdateExpression:         aws.String("SET #ip = :true"),
		ExpressionAttributeNames: map[string]string{"#ip": "imageProcessed"},
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":true": &types.AttributeValueMemberBOOL{Value: true},
		},
	})
	return err
}
