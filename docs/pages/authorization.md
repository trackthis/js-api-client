# Authorization

So what it this thing with tokens, scopes and secrets?

## Tokens

A token is simply a unique identifier you pass along with api calls so the remote server knows who you are and which permissions you have. Depending on how the token was created it may be valid for 5 seconds up to infinity, after which you can not use the token anymore to identify yourself to the server.  

## Scopes

Scopes might sound confusing, but they're actually just permission flag sets. Whenever you are assigned a certain scopes (or multiple) you receive all the permissions that the scope describes. Down below you can see some examples of permissions that might be inside a scope.

When fetching a token, you're also requesting a set of scopes to be assigned to that token. You will only get the scopes the user has & the user allows you to have though (this might result in reduced permissions for a token by choice of the user). 

## Permission flags

A permission flag is simply a fine-grained flag on which the remote server decides whether or not you are allowed to do something. These can be from viewing the user's email address to changing bank details or address information.

Aside from having specific permissions, tokens can have a set of scopes attached to them which in turn define which permissions your token has. When using this library, you shouldn't worry about permission flags (you'll know soon enough if your token isn't allowed to do something).

Here's an example list of permissions that might exist:

```
Account-related
    account.email            See the email address(es) of the logged-in account
    account.pubkey           See the public key(s) of the logged-in account
    account.roles            See the roles of the logged-in account

Authorization-related
    auth.list                See a list of authentication methods (no secrets)
    auth.create.token        Create new api tokens
    auth.create.token.inf    Create new api tokens which don't expire
    auth.create.token.full   Create new api tokens with the full permissions of the account
    auth.delete.token        Delete api tokens
    auth.delete.pass         Delete passwords

Application-related
    app.list                 List remote applications by this user
    app.list.admin           List all remote applications
    app.create               Create new remote applications
    app.create.trusted       Create new trusted remote applications
    app.delete               Delete a remote application by this user
    app.delete.admin         Delete any remote application
```
