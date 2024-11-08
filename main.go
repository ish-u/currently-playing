package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"html/template"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
)

func get_auth_token() (string, error) {
	v := url.Values{}
	v.Add("grant_type", "refresh_token")
	v.Add("client_id", os.Getenv("CLIENT_ID"))
	v.Add("client_secret", os.Getenv("CLIENT_SECRET"))
	v.Add("refresh_token", os.Getenv("REFRESH_TOKEN"))

	// fmt.Println(string(v.Encode()))

	req, err := http.NewRequest(http.MethodPost, "https://accounts.spotify.com/api/token", strings.NewReader(v.Encode()))
	if err != nil {
		fmt.Printf("Failed to fetch token : %v\n", err)
		return "", errors.New("failed to fetch token")
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("Failed to fetch token : %v\n", err)
		return "", errors.New("failed to fetch token")
	}

	type Data struct {
		Access_Token string `json:"access_token"`
	}
	var data Data
	if err := json.Unmarshal(body, &data); err != nil {
		return "", errors.New("failed to fetch access token")
	}

	return data.Access_Token, nil
}

func currently_playing(w http.ResponseWriter, req *http.Request) {
	client := &http.Client{}

	auth_token, err := get_auth_token()
	if err != nil {
		http.Error(w, "Failed to fetch auth token", http.StatusServiceUnavailable)
		return
	}

	current_playing_req, err := http.NewRequest("GET", "https://api.spotify.com/v1/me/player/currently-playing", nil)
	if err != nil {
		fmt.Printf("Failed read response body: %v\n", err)
	}

	current_playing_req.Header.Set("Authorization", "Bearer "+auth_token)

	resp, err := client.Do(current_playing_req)
	if err != nil {
		// fmt.Printf("Failed to fetch current playing: %v\n", err)
		http.Error(w, "Failed to fetch current playing", http.StatusServiceUnavailable)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		// fmt.Printf("Failed read response body: %v\n", err)
		http.Error(w, "Failed to read response body", http.StatusInternalServerError)
		return
	}

	type NowPlaying struct {
		Item struct {
			Album struct {
				Name   string `json:"name"`
				Images []struct {
					URL string `json:"url"`
				} `json:"images"`
			} `json:"album"`
			Name    string `json:"name"`
			Artists []struct {
				Name string `json:"name"`
			}
			External_URLs struct {
				Spotify string `json:"spotify"`
			} `json:"external_urls"`
		} `json:"item"`
	}
	var nowPlaying NowPlaying
	if err := json.Unmarshal(body, &nowPlaying); err != nil {
		fmt.Printf("Failed parse response body: %v\n", err)
		// http.Error(w, "Failed to parse response body", http.StatusInternalServerError)

		return
	}
	var artists strings.Builder
	for i, artist := range nowPlaying.Item.Artists {
		artists.WriteString(artist.Name)
		if i != len(nowPlaying.Item.Artists)-1 {
			artists.WriteString(", ")
		}
	}
	fmt.Println(nowPlaying.Item.Name, "-", artists.String(), nowPlaying.Item.Album.Images[0].URL, nowPlaying.Item.External_URLs.Spotify)

	response, err := json.Marshal(&struct {
		Name  string `json:"name,omitempty"`
		URL   string `json:"url,omitempty"`
		Image string `json:"image,omitempty"`
	}{
		Name:  nowPlaying.Item.Name + " - " + artists.String(),
		URL:   nowPlaying.Item.External_URLs.Spotify,
		Image: nowPlaying.Item.Album.Images[0].URL,
	})
	if err != nil {
		http.Error(w, "Failed to encode JSON", http.StatusInternalServerError)
	}
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(response)
}

func currently_playing_page(w http.ResponseWriter, req *http.Request) {
	client := &http.Client{}

	auth_token, err := get_auth_token()
	if err != nil {
		http.Error(w, "Failed to fetch auth token", http.StatusServiceUnavailable)
		return
	}

	current_playing_req, err := http.NewRequest("GET", "https://api.spotify.com/v1/me/player/currently-playing", nil)
	if err != nil {
		fmt.Printf("Failed read response body: %v\n", err)
	}

	current_playing_req.Header.Set("Authorization", "Bearer "+auth_token)

	resp, err := client.Do(current_playing_req)
	if err != nil {
		// fmt.Printf("Failed to fetch current playing: %v\n", err)
		http.Error(w, "Failed to fetch current playing", http.StatusServiceUnavailable)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		// fmt.Printf("Failed read response body: %v\n", err)
		http.Error(w, "Failed to read response body", http.StatusInternalServerError)
		return
	}

	type NowPlaying struct {
		Item struct {
			Album struct {
				Name   string `json:"name"`
				Images []struct {
					URL string `json:"url"`
				} `json:"images"`
			} `json:"album"`
			Name    string `json:"name"`
			Artists []struct {
				Name string `json:"name"`
			}
			External_URLs struct {
				Spotify string `json:"spotify"`
			} `json:"external_urls"`
		} `json:"item"`
	}
	var nowPlaying NowPlaying
	if err := json.Unmarshal(body, &nowPlaying); err != nil {
		fmt.Printf("Failed parse response body: %v\n", err)
		// http.Error(w, "Failed to parse response body", http.StatusInternalServerError)

		return
	}
	var artists strings.Builder
	for i, artist := range nowPlaying.Item.Artists {
		artists.WriteString(artist.Name)
		if i != len(nowPlaying.Item.Artists)-1 {
			artists.WriteString(", ")
		}
	}
	fmt.Println(nowPlaying.Item.Name, "-", artists.String(), nowPlaying.Item.Album.Images[0].URL, nowPlaying.Item.External_URLs.Spotify)

	response := struct {
		Name  string
		URL   string
		Image string
	}{
		Name:  nowPlaying.Item.Name + " - " + artists.String(),
		URL:   nowPlaying.Item.External_URLs.Spotify,
		Image: nowPlaying.Item.Album.Images[0].URL,
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "text/html")
	w.WriteHeader(http.StatusOK)

	htmlContent := `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{.Name}}</title>
		<link rel="icon" type="image/x-icon" href="{{.Image}}">
    </head>
	<style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    		display: flex;
    		justify-content: center;
    		align-items: center;
    		height: 70vh;
    		width: 100vw;
    		padding: 0;
    		margin: 0;
    		text-align: center;
        }
		a {
            text-decoration: none;
			color: black;
        }
    </style>
    <body>
		<a href="{{.URL}}">
			<img src="{{.Image}}" alt="{{.Name}} Cover Image" height="320px" width="320px" />
			<h1>{{.Name}}</h1>
		</a>
    </body>
    </html>
    `
	htmlContentTemplate, err := template.New("Currently Playing").Parse(htmlContent)
	if err != nil {
		fmt.Printf("Failed to create HTML template: %v\n", err)
	}
	err = htmlContentTemplate.Execute(w, response)
	if err != nil {
		fmt.Printf("Failed to fill HTML template: %v\n", err)
	}

}

func main() {
	// SetEnvironmentVariables()
	fmt.Println("currently-playing")
	http.HandleFunc("/currently-playing", currently_playing)
	http.HandleFunc("/currently-playing-page", currently_playing_page)
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		fmt.Printf("Error %s", err)
	}
}
