# OSFarm [![pages-build-deployment](https://github.com/osfarm/osfarm.github.io/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/osfarm/osfarm.github.io/actions/workflows/pages/pages-build-deployment)

![logo](assets/img/logo_white.png)

Gather, curate, and feature stories of people using and building open source project around farming.

The site is open source (here's all the code!) and is a tool _for_ and _by_ the community.

Submit [issues](https://github.com/osfarm/osfarm.github.io/issues/new) and [pull requests](https://github.com/osfarm/osfarm.github.io/compare) for stories, site ideas or copy edits.

### Goals

- Share stories of real world experiences using open source project on farm
- Demystify open source
- Showcase the community to promote connections and sharing between individuals, farms and farm organizations.

### Under the Hood

This site is made with [Jekyll](https://jekyllrb.com), an open source static site generator. This means the Jekyll program takes the content we want to be on the site and turns them into HTML files ready to be hosted somewhere. Awesomely, GitHub provides free web hosting for repositories, called [GitHub Pages](https://pages.github.com/), and that's how this site is hosted. The content for the site is on a branch named [main](https://github.com/osfarm/osfarm.github.io/tree/main).

## Contributing

#### Fix/Edit Content

If you see an error or a place where content should be updated or improved, just fork this repository to your account, make the change you'd like and then submit a pull request. If you're not able to make the change, file an [issue](https://github.com/osfarm/osfarm.github.io/issues/new).

#### Add Organization

If you know of an organization, people or project that should be added to the community list that generates the matrix of avatars on the [Community](https://osfarm.org/community/) page: fork this repository, open the [_data/projects.yml](_data/projects.yml), file and add it to the appropriate section of the list in the format being used. Commit your change and submit a pull request to us!

---

## To Set up Locally

You can take all the files of this site and run them just on your computer as if it were live online, only it's just on your machine.

#### Requirements

* [Jekyll](https://jekyllrb.com/)
* [Ruby](https://www.ruby-lang.org/en/)
* [Git](https://git-scm.com/)

_If you have installed [GitHub Desktop](https://desktop.github.com), Git was also installed automatically._

To copy the repository's files from here onto your computer and to view and serve those files locally, at your computer's command line type:

```bash
git clone git@github.com:osfarm/osfarm.github.io.git
cd osfarm.github.io
script/bootstrap
script/server
```
Open `http://localhost:4000` in your browser

Don't see what you're looking for? Create an [issue](https://github.com/osfarm/osfarm.github.io/issues/new), we'll do our best to help you out.

## License

The data in `_data` is free to use without restriction. For clarity these files, and contributions to these files, are released under [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/).
