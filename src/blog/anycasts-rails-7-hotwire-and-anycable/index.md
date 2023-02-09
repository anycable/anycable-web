# <img src="/public/images/demo.svg" class="blog--title-icon"> AnyCasts, Ep. 1:<br>Exploring Rails 7, Hotwire and AnyCable speedy streams

December 22, 2021
{date}

<br/>

Let us introduce **AnyCasts**—a screencast series on real-time web applications development. Rails and AnyCable, [Hotwire][hotwire] and [Stimulus Reflex][sr], Ruby and other languages—there is plenty of stuff to talk about!
<br/>
<br/>
Our very first episode is dedicated to the recent [Rails 7 release][rails-7]. And New Year 🎅
{intro}

<div class="divider"></div>

In this episode, we're going to build a new Rails 7 application from scratch—a very first prototype of what could become a Discord-like multi-channel chat. We will see how the new `--css=tailwind` option makes generated templates look cool, give Turbo Frames and Streams a try, and, finally, configure AnyCable with its brand new [JWT authentication][jwt-id-docs] and [_speedy_ streams][signed-streams-docs] features.

<figure class="blog--figure">
  <iframe class="blog--youtube" src="https://www.youtube.com/embed/0XTfL-iVLw4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</figure>

<div class="divider"></div>

**Links**:

- [Rails 7 release announcement][rails-7]
- [Turbo Frames][turbo-frames]
- [turbo-rails][]
- [AnyCable: JWT identification and "hot streams"](/blog/jwt-identification-and-hot-streams)
- [anycable-rails-jwt][]
- [Introducing Overmind & Hivemind](https://evilmartians.com/chronicles/introducing-overmind-and-hivemind)

[rails-7]: https://rubyonrails.org/2021/12/15/Rails-7-fulfilling-a-vision
[pro]: https://anycable.io/#pro
[hotwire]: https://hotwired.dev
[turbo-frames]: https://turbo.hotwired.dev/reference/frames
[sr]: https://docs.stimulusreflex.com
[cr]: https://cableready.stimulusreflex.com
[jwt-id-docs]: https://docs.anycable.io/anycable-go/jwt_identification
[signed-streams-docs]: https://docs.anycable.io/anycable-go/signed_streams
[anycable-rails-jwt]: https://github.com/anycable/anycable-rails-jwt
[turbo-rails]: https://github.com/hotwired/turbo-rails
