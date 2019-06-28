import { Decorators } from '../decorators/decorators.mjs';

export class GithubDataSource {
  constructor() {
    this.data_ = null;
  }
  get data() {
    return this.data_;
  }

  async load() {
    const data = await fetch('https://api.github.com/repos/vmpstr/canvasmap/issues').then(resp => resp.json());
    this.data_ = [];

    for (let i = 0; i < data.length; ++i) {
      this.data_.push(new GithubItem(data[i]));
    }
  }
}

GithubDataSource.id_namespace = "Github";

class GithubItem {
  constructor(json) {
    this.json_ = json;
  }

  construct(layout_item) {
    layout_item.label = this.json_.title;
    layout_item.ancestors = [];
    layout_item.descendants = [];
    layout_item.decorators.addDecorator(
      Decorators.create(
        Decorators.type.box,
        Decorators.anchor.right,
        Decorators.behavior.contained,
        {
          size: [20, 10],
          margin: 2,
          background_color: "blue",
          border_radius: 4,
          stroke_color: "white",
          stroke_width: 2
        })
    );
    layout_item.decorators.addDecorator(
      Decorators.create(
        Decorators.type.box,
        Decorators.anchor.bottom,
        Decorators.behavior.contained,
        {
          size: [20, 10],
          margin: 2,
          background_color: "green",
          border_radius: 4,
          stroke_color: "white",
          stroke_width: 2
        })
    );

    layout_item.decorators.last_added.addDecorator(
      Decorators.create(
        Decorators.type.box,
        Decorators.anchor.bottom,
        Decorators.behavior.contained,
        {
          size: [5, 5],
          background_color: "red"
        })
    );
  }

  get id_namespace() {
    return GithubDataSource.id_namespace;
  }

  get local_id() {
    return this.json_.id;
  }
}


/*
  {
    "url": "https://api.github.com/repos/vmpstr/canvasmap/issues/3",
    "repository_url": "https://api.github.com/repos/vmpstr/canvasmap",
    "labels_url": "https://api.github.com/repos/vmpstr/canvasmap/issues/3/labels{/name}",
    "comments_url": "https://api.github.com/repos/vmpstr/canvasmap/issues/3/comments",
    "events_url": "https://api.github.com/repos/vmpstr/canvasmap/issues/3/events",
    "html_url": "https://github.com/vmpstr/canvasmap/issues/3",
    "id": 461150767,
    "node_id": "MDU6SXNzdWU0NjExNTA3Njc=",
    "number": 3,
    "title": "Test issue assigned (with comments)",
    "user": {
      "login": "vmpstr",
      "id": 1906955,
      "node_id": "MDQ6VXNlcjE5MDY5NTU=",
      "avatar_url": "https://avatars2.githubusercontent.com/u/1906955?v=4",
      "gravatar_id": "",
      "url": "https://api.github.com/users/vmpstr",
      "html_url": "https://github.com/vmpstr",
      "followers_url": "https://api.github.com/users/vmpstr/followers",
      "following_url": "https://api.github.com/users/vmpstr/following{/other_user}",
      "gists_url": "https://api.github.com/users/vmpstr/gists{/gist_id}",
      "starred_url": "https://api.github.com/users/vmpstr/starred{/owner}{/repo}",
      "subscriptions_url": "https://api.github.com/users/vmpstr/subscriptions",
      "organizations_url": "https://api.github.com/users/vmpstr/orgs",
      "repos_url": "https://api.github.com/users/vmpstr/repos",
      "events_url": "https://api.github.com/users/vmpstr/events{/privacy}",
      "received_events_url": "https://api.github.com/users/vmpstr/received_events",
      "type": "User",
      "site_admin": false
    },
    "labels": [

    ],
    "state": "open",
    "locked": false,
    "assignee": {
      "login": "vmpstr",
      "id": 1906955,
      "node_id": "MDQ6VXNlcjE5MDY5NTU=",
      "avatar_url": "https://avatars2.githubusercontent.com/u/1906955?v=4",
      "gravatar_id": "",
      "url": "https://api.github.com/users/vmpstr",
      "html_url": "https://github.com/vmpstr",
      "followers_url": "https://api.github.com/users/vmpstr/followers",
      "following_url": "https://api.github.com/users/vmpstr/following{/other_user}",
      "gists_url": "https://api.github.com/users/vmpstr/gists{/gist_id}",
      "starred_url": "https://api.github.com/users/vmpstr/starred{/owner}{/repo}",
      "subscriptions_url": "https://api.github.com/users/vmpstr/subscriptions",
      "organizations_url": "https://api.github.com/users/vmpstr/orgs",
      "repos_url": "https://api.github.com/users/vmpstr/repos",
      "events_url": "https://api.github.com/users/vmpstr/events{/privacy}",
      "received_events_url": "https://api.github.com/users/vmpstr/received_events",
      "type": "User",
      "site_admin": false
    },
    "assignees": [
      {
        "login": "vmpstr",
        "id": 1906955,
        "node_id": "MDQ6VXNlcjE5MDY5NTU=",
        "avatar_url": "https://avatars2.githubusercontent.com/u/1906955?v=4",
        "gravatar_id": "",
        "url": "https://api.github.com/users/vmpstr",
        "html_url": "https://github.com/vmpstr",
        "followers_url": "https://api.github.com/users/vmpstr/followers",
        "following_url": "https://api.github.com/users/vmpstr/following{/other_user}",
        "gists_url": "https://api.github.com/users/vmpstr/gists{/gist_id}",
        "starred_url": "https://api.github.com/users/vmpstr/starred{/owner}{/repo}",
        "subscriptions_url": "https://api.github.com/users/vmpstr/subscriptions",
        "organizations_url": "https://api.github.com/users/vmpstr/orgs",
        "repos_url": "https://api.github.com/users/vmpstr/repos",
        "events_url": "https://api.github.com/users/vmpstr/events{/privacy}",
        "received_events_url": "https://api.github.com/users/vmpstr/received_events",
        "type": "User",
        "site_admin": false
      }
    ],
    "milestone": null,
    "comments": 0,
    "created_at": "2019-06-26T19:49:43Z",
    "updated_at": "2019-06-26T19:49:43Z",
    "closed_at": null,
    "author_association": "OWNER",
    "body": "Comments goes here."
  },
  {
    "url": "https://api.github.com/repos/vmpstr/canvasmap/issues/2",
    "repository_url": "https://api.github.com/repos/vmpstr/canvasmap",
    "labels_url": "https://api.github.com/repos/vmpstr/canvasmap/issues/2/labels{/name}",
    "comments_url": "https://api.github.com/repos/vmpstr/canvasmap/issues/2/comments",
    "events_url": "https://api.github.com/repos/vmpstr/canvasmap/issues/2/events",
    "html_url": "https://github.com/vmpstr/canvasmap/issues/2",
    "id": 461150608,
    "node_id": "MDU6SXNzdWU0NjExNTA2MDg=",
    "number": 2,
    "title": "Test issue with a label",
    "user": {
      "login": "vmpstr",
      "id": 1906955,
      "node_id": "MDQ6VXNlcjE5MDY5NTU=",
      "avatar_url": "https://avatars2.githubusercontent.com/u/1906955?v=4",
      "gravatar_id": "",
      "url": "https://api.github.com/users/vmpstr",
      "html_url": "https://github.com/vmpstr",
      "followers_url": "https://api.github.com/users/vmpstr/followers",
      "following_url": "https://api.github.com/users/vmpstr/following{/other_user}",
      "gists_url": "https://api.github.com/users/vmpstr/gists{/gist_id}",
      "starred_url": "https://api.github.com/users/vmpstr/starred{/owner}{/repo}",
      "subscriptions_url": "https://api.github.com/users/vmpstr/subscriptions",
      "organizations_url": "https://api.github.com/users/vmpstr/orgs",
      "repos_url": "https://api.github.com/users/vmpstr/repos",
      "events_url": "https://api.github.com/users/vmpstr/events{/privacy}",
      "received_events_url": "https://api.github.com/users/vmpstr/received_events",
      "type": "User",
      "site_admin": false
    },
    "labels": [
      {
        "id": 1424609992,
        "node_id": "MDU6TGFiZWwxNDI0NjA5OTky",
        "url": "https://api.github.com/repos/vmpstr/canvasmap/labels/test%20label",
        "name": "test label",
        "color": "1fa016",
        "default": false
      }
    ],
    "state": "open",
    "locked": false,
    "assignee": null,
    "assignees": [

    ],
    "milestone": null,
    "comments": 0,
    "created_at": "2019-06-26T19:49:19Z",
    "updated_at": "2019-06-26T19:49:19Z",
    "closed_at": null,
    "author_association": "OWNER",
    "body": ""
  },
  {
    "url": "https://api.github.com/repos/vmpstr/canvasmap/issues/1",
    "repository_url": "https://api.github.com/repos/vmpstr/canvasmap",
    "labels_url": "https://api.github.com/repos/vmpstr/canvasmap/issues/1/labels{/name}",
    "comments_url": "https://api.github.com/repos/vmpstr/canvasmap/issues/1/comments",
    "events_url": "https://api.github.com/repos/vmpstr/canvasmap/issues/1/events",
    "html_url": "https://github.com/vmpstr/canvasmap/issues/1",
    "id": 461150492,
    "node_id": "MDU6SXNzdWU0NjExNTA0OTI=",
    "number": 1,
    "title": "Test issue",
    "user": {
      "login": "vmpstr",
      "id": 1906955,
      "node_id": "MDQ6VXNlcjE5MDY5NTU=",
      "avatar_url": "https://avatars2.githubusercontent.com/u/1906955?v=4",
      "gravatar_id": "",
      "url": "https://api.github.com/users/vmpstr",
      "html_url": "https://github.com/vmpstr",
      "followers_url": "https://api.github.com/users/vmpstr/followers",
      "following_url": "https://api.github.com/users/vmpstr/following{/other_user}",
      "gists_url": "https://api.github.com/users/vmpstr/gists{/gist_id}",
      "starred_url": "https://api.github.com/users/vmpstr/starred{/owner}{/repo}",
      "subscriptions_url": "https://api.github.com/users/vmpstr/subscriptions",
      "organizations_url": "https://api.github.com/users/vmpstr/orgs",
      "repos_url": "https://api.github.com/users/vmpstr/repos",
      "events_url": "https://api.github.com/users/vmpstr/events{/privacy}",
      "received_events_url": "https://api.github.com/users/vmpstr/received_events",
      "type": "User",
      "site_admin": false
    },
    "labels": [

    ],
    "state": "open",
    "locked": false,
    "assignee": null,
    "assignees": [

    ],
    "milestone": null,
    "comments": 0,
    "created_at": "2019-06-26T19:49:00Z",
    "updated_at": "2019-06-26T19:49:00Z",
    "closed_at": null,
    "author_association": "OWNER",
    "body": ""
  }
*/
