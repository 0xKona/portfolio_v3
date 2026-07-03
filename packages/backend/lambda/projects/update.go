// PUT /api/projects/{id} — updates an existing project.
// Only fields provided in the request body are updated.
// Manages GSI2 sparse index: adds GSI2PK/GSI2SK when isFeatured=true AND
// status="published", removes them otherwise.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

// UpdateProjectRequest contains all updatable fields. Nil means "don't update".
type UpdateProjectRequest struct {
	Name       *string  `json:"name"`
	Desc       *string  `json:"desc"`
	Skills     []string `json:"skills"`
	GithubUrl  *string  `json:"githubUrl"`
	DemoUrl    *string  `json:"demoUrl"`
	IsFeatured *bool    `json:"isFeatured"`
	Status     *string  `json:"status"`
}

func handleUpdate(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Extract project ID from path parameters.
	id := request.PathParameters["id"]
	if id == "" {
		return jsonResponse(400, map[string]string{"message": "missing project id in path"})
	}

	// Parse the request body.
	var req UpdateProjectRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return jsonResponse(400, map[string]string{"message": "invalid JSON body"})
	}

	// Build the UpdateItem expression dynamically based on which fields are present.
	now := time.Now().UTC().Format(time.RFC3339)
	exprNames := map[string]string{}
	exprValues := map[string]types.AttributeValue{}
	setClauses := []string{}
	removeClauses := []string{}

	// Always update updatedAt.
	exprNames["#updatedAt"] = "updatedAt"
	exprValues[":updatedAt"] = &types.AttributeValueMemberS{Value: now}
	setClauses = append(setClauses, "#updatedAt = :updatedAt")

	if req.Name != nil {
		exprNames["#name"] = "name"
		exprValues[":name"] = &types.AttributeValueMemberS{Value: *req.Name}
		setClauses = append(setClauses, "#name = :name")
	}

	if req.Desc != nil {
		exprNames["#desc"] = "desc"
		exprValues[":desc"] = &types.AttributeValueMemberS{Value: *req.Desc}
		setClauses = append(setClauses, "#desc = :desc")
	}

	if req.Skills != nil {
		exprNames["#skills"] = "skills"
		skillsList := make([]types.AttributeValue, len(req.Skills))
		for i, s := range req.Skills {
			skillsList[i] = &types.AttributeValueMemberS{Value: s}
		}
		exprValues[":skills"] = &types.AttributeValueMemberL{Value: skillsList}
		setClauses = append(setClauses, "#skills = :skills")
	}

	if req.GithubUrl != nil {
		exprNames["#githubUrl"] = "githubUrl"
		exprValues[":githubUrl"] = &types.AttributeValueMemberS{Value: *req.GithubUrl}
		setClauses = append(setClauses, "#githubUrl = :githubUrl")
	}

	if req.DemoUrl != nil {
		exprNames["#demoUrl"] = "demoUrl"
		exprValues[":demoUrl"] = &types.AttributeValueMemberS{Value: *req.DemoUrl}
		setClauses = append(setClauses, "#demoUrl = :demoUrl")
	}

	if req.IsFeatured != nil {
		exprNames["#isFeatured"] = "isFeatured"
		exprValues[":isFeatured"] = &types.AttributeValueMemberBOOL{Value: *req.IsFeatured}
		setClauses = append(setClauses, "#isFeatured = :isFeatured")
	}

	// "status" is a DynamoDB reserved word — must use expression name alias.
	if req.Status != nil {
		if *req.Status != "draft" && *req.Status != "published" {
			return jsonResponse(400, map[string]string{"message": "status must be 'draft' or 'published'"})
		}
		exprNames["#st"] = "status"
		exprValues[":st"] = &types.AttributeValueMemberS{Value: *req.Status}
		setClauses = append(setClauses, "#st = :st")
	}

	// Manage GSI2 sparse index. We need to know the final state of isFeatured
	// and status to decide whether to add or remove GSI2 attributes.
	// Since we may not have both values in the request, we do a conditional
	// set/remove based on what's being updated.
	// If both isFeatured=true and status="published" → set GSI2PK/GSI2SK.
	// Otherwise → remove them so the item disappears from the sparse index.
	if req.IsFeatured != nil || req.Status != nil {
		exprNames["#GSI2PK"] = "GSI2PK"
		exprNames["#GSI2SK"] = "GSI2SK"

		// We need to read the current item to know the full state. For simplicity
		// we require both fields to be in the request when changing either one,
		// or we fetch the current values. Here we'll fetch current values.
		currentItem, err := dbClient.GetItem(ctx, &dynamodb.GetItemInput{
			TableName: aws.String(tableName),
			Key: map[string]types.AttributeValue{
				"PK": &types.AttributeValueMemberS{Value: fmt.Sprintf("PROJECT#%s", id)},
				"SK": &types.AttributeValueMemberS{Value: fmt.Sprintf("PROJECT#%s", id)},
			},
			ProjectionExpression: aws.String("isFeatured, #st, createdAt"),
			ExpressionAttributeNames: map[string]string{
				"#st": "status",
			},
		})
		if err != nil {
			return jsonResponse(500, map[string]string{"message": fmt.Sprintf("failed to read current item: %v", err)})
		}

		// Determine final values.
		featured := getBool(currentItem.Item, "isFeatured")
		status := getString(currentItem.Item, "status")
		createdAt := getString(currentItem.Item, "createdAt")

		if req.IsFeatured != nil {
			featured = *req.IsFeatured
		}
		if req.Status != nil {
			status = *req.Status
		}

		if featured && status == "published" {
			// Add to GSI2 sparse index.
			exprValues[":gsi2pk"] = &types.AttributeValueMemberS{Value: "FEATURED"}
			exprValues[":gsi2sk"] = &types.AttributeValueMemberS{Value: createdAt}
			setClauses = append(setClauses, "#GSI2PK = :gsi2pk, #GSI2SK = :gsi2sk")
		} else {
			// Remove from GSI2 sparse index.
			removeClauses = append(removeClauses, "#GSI2PK", "#GSI2SK")
		}
	}

	// Build the full update expression.
	updateExpr := "SET " + joinClauses(setClauses, ", ")
	if len(removeClauses) > 0 {
		updateExpr += " REMOVE " + joinClauses(removeClauses, ", ")
	}

	// Execute the update. Condition ensures the item exists.
	result, err := dbClient.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(tableName),
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: fmt.Sprintf("PROJECT#%s", id)},
			"SK": &types.AttributeValueMemberS{Value: fmt.Sprintf("PROJECT#%s", id)},
		},
		UpdateExpression:          aws.String(updateExpr),
		ExpressionAttributeNames:  exprNames,
		ExpressionAttributeValues: exprValues,
		ConditionExpression:       aws.String("attribute_exists(PK)"),
		ReturnValues:              types.ReturnValueAllNew,
	})
	if err != nil {
		var ccf *types.ConditionalCheckFailedException
		if errors.As(err, &ccf) {
			return jsonResponse(404, map[string]string{"message": "project not found"})
		}
		return jsonResponse(500, map[string]string{"message": fmt.Sprintf("dynamodb error: %v", err)})
	}

	// Return the updated project from the ALL_NEW response.
	return jsonResponse(200, map[string]interface{}{
		"id":         getString(result.Attributes, "id"),
		"name":       getString(result.Attributes, "name"),
		"desc":       getStringPtr(result.Attributes, "desc"),
		"skills":     getStringList(result.Attributes, "skills"),
		"githubUrl":  getStringPtr(result.Attributes, "githubUrl"),
		"demoUrl":    getStringPtr(result.Attributes, "demoUrl"),
		"isFeatured": getBool(result.Attributes, "isFeatured"),
		"status":     getString(result.Attributes, "status"),
		"createdAt":  getString(result.Attributes, "createdAt"),
		"updatedAt":  getString(result.Attributes, "updatedAt"),
	})
}

// Helper: join string slices with a separator.
func joinClauses(parts []string, sep string) string {
	result := ""
	for i, p := range parts {
		if i > 0 {
			result += sep
		}
		result += p
	}
	return result
}

// Helper: extract a string value from a DynamoDB attribute map.
func getString(item map[string]types.AttributeValue, key string) string {
	if v, ok := item[key]; ok {
		if s, ok := v.(*types.AttributeValueMemberS); ok {
			return s.Value
		}
	}
	return ""
}

// Helper: extract a string pointer (nil if attribute missing or empty).
func getStringPtr(item map[string]types.AttributeValue, key string) *string {
	if v, ok := item[key]; ok {
		if s, ok := v.(*types.AttributeValueMemberS); ok {
			return &s.Value
		}
	}
	return nil
}

// Helper: extract a bool value from a DynamoDB attribute map.
func getBool(item map[string]types.AttributeValue, key string) bool {
	if v, ok := item[key]; ok {
		if b, ok := v.(*types.AttributeValueMemberBOOL); ok {
			return b.Value
		}
	}
	return false
}

// Helper: extract a string list from a DynamoDB L attribute.
func getStringList(item map[string]types.AttributeValue, key string) []string {
	if v, ok := item[key]; ok {
		if l, ok := v.(*types.AttributeValueMemberL); ok {
			result := make([]string, 0, len(l.Value))
			for _, av := range l.Value {
				if s, ok := av.(*types.AttributeValueMemberS); ok {
					result = append(result, s.Value)
				}
			}
			return result
		}
	}
	return []string{}
}
