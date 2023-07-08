# release-chrome-extension

This is a GitHub Action to publish a Chrome extension to the Chrome Web Store.

## Usage

The minimal usage is as follows:

```yaml
steps:
steps:
- uses: browser-actions/release-chrome-extension@latest
  with:
    extension-id: "********************************"
    extension-path: "path/to/your/extension.zip"
    oauth-client-id: ${{ secrets.OAUTH_CLIENT_ID }}
    oauth-client-secret: ${{ secrets.OAUTH_CLIENT_SECRET }}
    oauth-refresh-token: ${{ secrets.OAUTH_REFRESH_TOKEN }}
```

The `oauth-client-id`, `oauth-client-secret`, and `refresh-token` are all required to authenticate with the Chrome Web Store API. You can find more information on how to get these values [here](https://developer.chrome.com/webstore/using_webstore_api#beforeyoubegin).  There is also a mock OAuth2 application that can be used to get a refresh token.  You can get the token by running the following command:

```console
$ node oauth-mock-app/server.mjs
```

### Inputs

All supported outputs are the following:

| Name                  | Description                         | Required |
| ---                   | ---                                 | ---      |
| `extension-id`        | The ID of the extension to publish. | Yes      |
| `extension-path`      | The path to the extension zip file. | Yes      |
| `oauth-client-id`     | The OAuth2 client ID.               | Yes      |
| `oauth-client-secret` | The OAuth2 client secret.           | Yes      |
| `oauth-refresh-token` | The OAuth2 refresh token.           | Yes      |

## License

[MIT](LICENSE)
