# AnyCable PRO:<br>JWT identification and "hot streams"

September 27, 2021
{date}

When we started collecting applications for the [AnyCable PRO][pro] early access program back in July, we asked respondents to share the way they use _cables_ and which features they would like us to provide out-of-the-box. The analysis of their responses led to the development of two new PRO features, [JWT identification][jwt-id-docs] and [Signed streams support][signed-streams-docs], which might seem unrelated to each other from the first look but turned out to bring a huge performance boost when used together. Continue reading to learn more!
{intro}

<div class="divider"></div>

## Dealing with authentication

Among the requested features, one of the leaders was "a token-based authentication". Most Action Cable applications relies on cookies as an authentication mechanism (directly or via sessions). The main benefit of the cookie-based authentication is the simplicity: it just works. However, there are some drawbacks:

- Authenticating non-web clients (e.g., mobile apps) is becoming cumbersome.
- Rails API-only apps usually do not use tokens for web clients authentication as well (they use tokens).
- WebSockets have no CORS support and, thus, **vulnerable to cross-site request forgery** (or [cross-site WebSocket hijacking][cross-site-ws-hijack]).

Using tokens could help us to solve these problems. What's the cost? Well, we have to build everything ourselves, both server and client side (and good luck with finding a library or gem which makes it easier not harder).

While I was thinking on how to incorporate tokens into AnyCable, I realized that we can also leverage this feature to improve the performance: tokens could also carry **identification** information, and thus, could be used instead of calling an RPC server (`Authenticate` method).

Let's recall how Action Cable (and AnyCable) works in the context of authentication and identification.

Whenever a new connection opens, the `ApplicationCable::Connection#connect` method is called. That's the place where you can reject the connection ([`#reject_unathorized_connection`][reject-connection]) and where you configure so-called _connection identifiers_ ([`.identifed_by`][ac-identifiers]). Identifiers represent the client state which could be used by channels (e.g., `current_user` or `current_tenant`). AnyCable obtains identifiers during the `Authenticate` call and pass along all subsequent requests (in a [serialized form][identifiers-serialization]).

To sum up, all we need from the `#connect` method is to accept-or-reject connection and populate identifiers. And we can encapsulate this logic within a single [JWT][] token!

This is how it could look in pure Ruby. First, let's create a helper to build a connection url with a token:

```ruby
class ApplicationHelper
  def action_cable_with_jwt_meta_tag(**identifiers)
    # Token TTL (5 minutes)
    exp = Time.now.to_i + 60*5
    # JWT payload.
    # The #serialize_identifiers is responsible for serializing objects into strings
    # (AnyCable uses GlobalID for that)
    payload = {ext: serialize_identifiers(identifiers), exp: exp}

    token = JWT.encode payload, JWT_ENCRYPTION_KEY, "HS256"

    base_url = ActionCable.server.config.url || ActionCable.server.config.mount_path
    tag "meta", name: "action-cable-url", content: "#{base_url}?token=#{token}"
  end
end
```

Now we can add it to our layout:

```erb
<%= action_cable_with_jwt_meta_tag(current_user: current_user) %> would render:
# => <meta name="action-cable-url" content="ws://demo.anycable.io/cable?token=eyJhbGciOiJIUzI1NiJ9....EWCEzziOx3sKyMoNzBt20a3QvhEdxJXCXaZsA-f-UzU" />
```

Finally, we need to verify the token and extract the identifiers in the `#connect` method:

```ruby
module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      token = request.params[:token]

      decoded_token = JWT.decode token, JWT_ENCRYPTION_KEY, true, { algorithm: "HS256" }
      # The #deserialize_identifiers method is a counterpart to #serialize_identifiers
      # and is responsible for converting strings back to objects
      identifiers = deserialize_identifiers(JSON.parse(decoded_token["ext"]))

      # Populate identifiers
      identifiers.each do |k, v|
        self.public_send("#{k}=", v)
      end
    rescue JWT::DecodeError
      reject_unauthorized_connection
    end
  end
end
```

Doesn't look like a simple solution 😕 If you'll continue staring at this piece of code for a while, you may notice that the implementation has nothing specific to a particular application: we retrieve a token, verify it and extract identifiers. If so, why can't we re-implement this in Go? We can!

This is how AnyCable Go PRO JWT identification works:

- A client passes a token along the connection request (via a query string or a header).
- Go server retrieves a header, verifies its signature and TTL, and rejects the connection if token is invalid.
- If token is valid, we extract identifiers, store them in the connection metadata and finalize the handshake (by sending a `{"type":"welcome"}` message).

And we do not perform any RPC calls! Let's see how it affects the connection time:

<figure class="blog--figure">
<video loop="loop" muted="muted" autoplay="autoplay" playsinline="true" width="1221" height="800" class="blog--media">
  <source src="./connect-benchmark.h264.mp4" ttype="video/mp4; codecs=avc1.4D401E,mp4a.40.2">
</video>
</figure>

More than 2x faster! What's more important, we reduce the stress on the RPC server. That could be especially useful during _connection avalanches_.

> JWT identification allows you to standardize the authentication flow for WebSockets, saves from cross-site WebSocket hijacking and brings a performance boost!

And that's what you can get with AnyCable PRO and a little companion gem, [anycable-rails-jwt][], which adds helpers to generate tokens.

The only question left is how to handle tokens expiration gracefully? AnyCable Go uses a specific disconnect reason to distinguish expiration from unauthorized access (sends a `{"type":"disconnect","reason":"token_expired"}` message). You can use it to refresh the token. We plan to add a built-in refresh functionality to our [anycable-client][] library soon. Stay tuned!

## Adding some "hot wires" to the equation

We've collected more than a hundred responses from Action Cable / AnyCable users around the world, and found that a good portion of them build applications on top of [Hotwire][hotwire] or [Stimulus Reflex][sr] (+ [CableReady][cr]). Which is pretty cool: [_frontendless_ Rails frontend][frontendless-rails] is getting more and more traction!

What can AnyCable give to these users? Let's take a look at how Turbo Streams work with Rails.

We have the [turbo-rails][] gem, which integrate Action Cable with Hotwire. All you need is to drop a helper into your template to start consuming streams:

```erb
<%= turbo_stream_from some_model %>
```

The helper adds a [`<turbo-cable-stream-source>` element][turbo-cable-stream-source], which initiates an Action Cable subscription. The corresponding server-side code is as follows:

```ruby
class Turbo::StreamsChannel < ActionCable::Channel::Base
  extend Turbo::Streams::Broadcasts, Turbo::Streams::StreamName

  def subscribed
    if verified_stream_name = self.class.verified_stream_name(params[:signed_stream_name])
      stream_from verified_stream_name
    else
      reject
    end
  end
end
```

The `#verified_stream_name` method uses an [`ActiveSupport::MessageVerifier`][message-verifier] to decode and verify the stream name. The subscription is rejected if the signed stream name is invalid.

The code above is structurely the same as the one we wrote for JWT identification. What does it mean? We can "move" the implementation to AnyCable Go server and **create subscriptions without touching RPC**. Again.

That's exactly what we did as a part of the [Signed streams][signed-streams-docs] feature. And we did it not only for Turbo Streams, but for Cable Ready as well (since its [`#stream_from` implementation][cr-stream-from] is almost the same).

> Combining JWT identification with signed streams, it is possible to avoid running RPC server at all in case you only use Hotwire/CableReady functionality.

Below is the visualization of the RPC server metrics during Hotwire benchmarks with four different configuration (blue markers), from left to rifght: baseline (AnyCable PRO w/o any features enabled), with JWT identification, with signed streams, and with both features enabled at the same time.

<figure class="blog--figure">
  <img class="blog--media" title="AnyCable metrics when running with and without JWT and 'hot' streams" src="./grafana.png" width="1364" height="624">
</figure>

No surpises that the last one shows zeros for RPC metrics—it hasn't been bothered at all. We can also notice that the AnyCable Go CPU usage is the lowest for the fourth scenario—**dealing with tokens and signatures is "cheaper" than performing gRPC calls**.

<div class="divider"></div>

We added these features in response to our users needs. because we believe that together we can build a much better product. Want to join The Team? Give [AnyCable a try today](/)!

[pro]: https://anycable.io/#pro
[hotwire]: https://hotwired.dev
[sr]: https://docs.stimulusreflex.com
[cr]: https://cableready.stimulusreflex.com
[jwt-id-docs]: https://docs.anycable.io/anycable-go/jwt_identification
[signed-streams-docs]: https://docs.anycable.io/anycable-go/signed_streams
[frontendless-rails]: https://noti.st/palkan/eVl0xO/frontendless-rails-frontend
[cross-site-ws-hijack]: https://portswigger.net/web-security/websockets/cross-site-websocket-hijacking
[ac-identifiers]: https://api.rubyonrails.org/v6.1.4/classes/ActionCable/Connection/Identification/ClassMethods.html#method-i-identified_by
[reject-connection]: https://api.rubyonrails.org/classes/ActionCable/Connection/Authorization.html#method-i-reject_unauthorized_connection
[identifiers-serialization]: https://github.com/anycable/anycable-rails/blob/master/lib/anycable/rails/actioncable/connection/serializable_identification.rb
[JWT]: https://jwt.io
[anycable-rails-jwt]: https://github.com/anycable/anycable-rails-jwt
[anycable-client]: https://github.com/anycable/anycable-client
[turbo-rails]: https://github.com/hotwired/turbo-rails
[turbo-rails-channel]: https://github.com/hotwired/turbo-rails/blob/main/app/channels/turbo/streams_channel.rb
[turbo-cable-stream-source]: https://github.com/hotwired/turbo/blob/main/src/elements/stream_element.ts
[message-verifier]: https://api.rubyonrails.org/v6.1.4/classes/ActiveSupport/MessageVerifier.html
[cr-stream-from]: https://github.com/stimulusreflex/cable_ready/blob/master/app/channels/cable_ready/stream.rb
