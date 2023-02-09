# <img src="/public/images/demo.svg" class="blog--title-icon"> AnyCasts, Ep. 4:<br>Using anycable-client to auto-refresh tokens

May 10, 2022
{date}

<br/>

<div class="divider"></div>

This episode continues exploring our [token-based authentication][token-auth-docs] and the token expiration problem in particular. To solve it, we switch to [AnyCable JS client][anycable-client], which provides a token refreshing mechanism out-of-the-box.

The migration process involves some JavaScript debugging and re-implementing [@hotwired/turbo-rails][turbo-rails] functionality.

<figure class="blog--figure">
  <iframe class="blog--youtube" src="https://youtube.com/embed/6OHdua_bUfI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</figure>

<div class="divider"></div>

**Links**:

- [anycable-client][]
- [Introducing JavaScript and TypeScript client for AnyCable][anycable-client-post]
- [AnyCable JWT identification][token-auth-docs]

[pro]: https://anycable.io/#pro
[hotwire]: https://hotwired.dev
[turbo-rails]: https://github.com/hotwired/turbo-rails
[anycable-client-post]: https://evilmartians.com/chronicles/introducing-anycable-javascript-and-typescript-client
[anycable-client]: https://github.com/anycable/anycable-client
[token-auth-docs]: https://docs.anycable.io/anycable-go/jwt_identification
