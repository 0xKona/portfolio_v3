package main

import (
	"context"
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	body, _ := json.Marshal(map[string]string{
		"message": "image-upload-url handler not implemented",
		"method":  request.HTTPMethod,
		"path":    request.Path,
	})

	return events.APIGatewayProxyResponse{
		StatusCode: 501,
		Body:       string(body),
		Headers:    map[string]string{"Content-Type": "application/json"},
	}, nil
}

func main() {
	lambda.Start(handler)
}
