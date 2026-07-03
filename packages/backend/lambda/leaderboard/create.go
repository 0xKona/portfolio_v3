package main

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"regexp"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/google/uuid"
)

var nameRegex = regexp.MustCompile(`^[a-zA-Z0-9]+$`)

type CreateScoreRequest struct {
	PlayerName string `json:"playerName"`
	Score      string `json:"score"`
	Multiplier string `json:"multiplier"`
	FinalScore string `json:"finalScore"`
	Game       string `json:"game"`
	Signature  string `json:"signature"`
}

type ScoreItem struct {
	PK         string `dynamodbav:"PK"`
	SK         string `dynamodbav:"SK"`
	GSI1PK     string `dynamodbav:"GSI1PK"`
	GSI1SK     string `dynamodbav:"GSI1SK"`
	ID         string `dynamodbav:"id"`
	PlayerName string `dynamodbav:"playerName"`
	Score      string `dynamodbav:"score"`
	Multiplier string `dynamodbav:"multiplier"`
	FinalScore string `dynamodbav:"finalScore"`
	Game       string `dynamodbav:"game,omitempty"`
	CreatedAt  string `dynamodbav:"createdAt"`
	UpdatedAt  string `dynamodbav:"updatedAt"`
}

func handleCreate(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var req CreateScoreRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return jsonResponse(400, map[string]string{"message": "invalid JSON body"})
	}

	if errs := validateScore(req); len(errs) > 0 {
		return jsonResponse(400, map[string]interface{}{"message": "validation failed", "errors": errs})
	}

	// Verify HMAC signature. The game client signs the score payload with
	// the shared secret at game end. This prevents arbitrary score submission.
	if !verifyHMAC(req) {
		return jsonResponse(403, map[string]string{"message": "invalid signature"})
	}

	now := time.Now().UTC().Format(time.RFC3339)
	id := uuid.New().String()

	item := ScoreItem{
		PK:         fmt.Sprintf("GAMESCORE#%s", id),
		SK:         fmt.Sprintf("GAMESCORE#%s", id),
		GSI1PK:     "GAMESCORE",
		GSI1SK:     now,
		ID:         id,
		PlayerName: req.PlayerName,
		Score:      req.Score,
		Multiplier: req.Multiplier,
		FinalScore: req.FinalScore,
		Game:       req.Game,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	av, err := attributevalue.MarshalMap(item)
	if err != nil {
		return jsonResponse(500, map[string]string{"message": "failed to marshal item"})
	}

	_, err = dbClient.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      av,
	})
	if err != nil {
		return jsonResponse(500, map[string]string{"message": fmt.Sprintf("dynamodb error: %v", err)})
	}

	return jsonResponse(201, map[string]interface{}{
		"id":         item.ID,
		"playerName": item.PlayerName,
		"score":      item.Score,
		"multiplier": item.Multiplier,
		"finalScore": item.FinalScore,
		"game":       item.Game,
		"createdAt":  item.CreatedAt,
		"updatedAt":  item.UpdatedAt,
	})
}

func validateScore(req CreateScoreRequest) []string {
	var errs []string
	if req.PlayerName == "" {
		errs = append(errs, "playerName is required")
	} else if len(req.PlayerName) > 20 {
		errs = append(errs, "playerName must be 20 characters or fewer")
	} else if !nameRegex.MatchString(req.PlayerName) {
		errs = append(errs, "playerName must be alphanumeric only")
	}
	if req.Score == "" {
		errs = append(errs, "score is required")
	}
	if req.Multiplier == "" {
		errs = append(errs, "multiplier is required")
	}
	if req.FinalScore == "" {
		errs = append(errs, "finalScore is required")
	}
	if req.Signature == "" {
		errs = append(errs, "signature is required")
	}
	return errs
}

// verifyHMAC checks that the client-provided signature matches the expected
// HMAC-SHA256 of the score payload. The message is constructed as a
// deterministic concatenation of the score fields.
func verifyHMAC(req CreateScoreRequest) bool {
	if hmacSecret == "" {
		// If no secret is configured, skip verification (dev/test convenience).
		return true
	}

	// Build the message to sign: playerName|score|multiplier|finalScore
	message := fmt.Sprintf("%s|%s|%s|%s", req.PlayerName, req.Score, req.Multiplier, req.FinalScore)

	mac := hmac.New(sha256.New, []byte(hmacSecret))
	mac.Write([]byte(message))
	expected := hex.EncodeToString(mac.Sum(nil))

	return hmac.Equal([]byte(expected), []byte(req.Signature))
}
