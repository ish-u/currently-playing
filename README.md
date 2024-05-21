## currently playing

get the currently playing song from Spotify

```json
{
  "name": "Why Are Sundays So Depressing - The Strokes",
  "url": "https://open.spotify.com/track/1aOxOpH4AkGAd8OMrKjyNY",
  "image": "https://i.scdn.co/image/ab67616d0000b273bfa99afb5ef0d26d5064b23b"
}
```

### run locally

- Set the environment variables by adding a new file called `env.go` with the following variables

  ```go
  package main
  import "os"
  func SetEnvironmentVariables() {
    os.Setenv("CLIENT_ID", "YOUR_SPOTIFY_CLIENT_ID")
    os.Setenv("CLIENT_SECRET", "YOUR_SPOTIFY_CLIENT_SECRET")
    os.Setenv("REFRESH_TOKEN", "YOUR_SPOTIFY_REFRESH_TOKEN")
  }
  ```

  Find more about how to get these on [Spotify OAuth Documentation](https://developer.spotify.com/documentation/web-api/tutorials/code-flow)

- Uncomment `SetEnvironmentVariables()` in `main.go`

- Run `go run .` to start the application

- Running `curl http://localhost:8080/currently-playing` will return if something is playing
  ```json
  {
    "name": "Nikamma - Lifafa",
    "url": "https://open.spotify.com/track/0yrCxEoGU4cV3CGr0sc65J",
    "image": "https://i.scdn.co/image/ab67616d0000b273ccb8f637c8dd7422f4266bfa"
  }
  ```

### deploy

- make sure to expose PORT `8080` when you are deploying
