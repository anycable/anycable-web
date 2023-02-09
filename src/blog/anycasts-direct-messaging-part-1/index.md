# <img src="/public/images/demo.svg" class="blog--title-icon"> AnyCasts, Ep. 2:<br>Of users and direct messaging (pt. 1)

February 16, 2022
{date}

<br/>

<div class="divider"></div>

We begin working on a [direct messaging feature](https://github.com/anycable/anycasts/issues/1). This episode covers all the preliminary work: adding users to the app, setting up a basic authentication flow via Rails [`has_secure_password`][secure_password], adding an ability to show a user's profile. For the latter one, we use [Turbo Frames][turbo-frames] and [Stimulus JS][stimulus] sprinkles.

<figure class="blog--figure">
  <iframe class="blog--youtube" src="https://www.youtube.com/embed/cBtSjNuJFLE" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</figure>

<div class="divider"></div>

**Links**:

- [Rails has_secure_password docs][secure_password]
- [`.authenticate_by` PR](https://github.com/rails/rails/pull/43765)
- [Turbo Frames][turbo-frames]
- [Stimulus state management](https://stimulus.hotwired.dev/handbook/managing-state)
- [Turbo permanent elements](https://turbo.hotwired.dev/handbook/building#persisting-elements-across-page-loads)

[pro]: https://anycable.io/#pro
[hotwire]: https://hotwired.dev
[turbo-frames]: https://turbo.hotwired.dev/reference/frames
[stimulus]: https://stimulus.hotwired.dev
[secure_password]: https://api.rubyonrails.org/classes/ActiveModel/SecurePassword/ClassMethods.html
