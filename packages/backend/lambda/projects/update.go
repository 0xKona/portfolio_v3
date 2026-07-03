package main

import (
	"context"

	"github.com/aws/aws-lambda-go/events"
)

func handleUpdate(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	return jsonResponse(501, map[string]string{"message": "PUT not implemented"})
}
