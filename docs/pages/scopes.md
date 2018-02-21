# Authorizations

So what it this thing with tokens, scopes and secrets?

## Tokens

A token is simply a unique identifier you pass along with api calls so the remote server knows who you are and which permissions you have. Depending on how the token was created it may be valid for 5 seconds up to infinity, after which you can not use the token anymore to identify yourself to the server.  

## Scopes

A scope is simply a flag on which the remote server decides whether or not you are allowed to do something. These can be from logging in, viewing the user's email address to changing bank details or address information.

Each token has it's own set of scopes attached to it. This allows you to create (& share) api tokens which have limited permissions to prevent someone from abusing your generosity.

Here's a list of scopes/permissions you can request when claiming a token:

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
    auth.create.pass         Create new passwords
    auth.create.pass.inf     Create new passwords which don't expire
    auth.create.pass.full    Create new passwords with the full permissions of the account
    auth.delete.token        Delete api tokens
    auth.delete.pass         Delete passwords

Application-related
    app.list                 List remote applications by this user
    app.list.admin           List all remote applications
    app.create               Create new remote applications
    app.create.trusted       Create new trusted remote applications
    app.delete               Delete a remote application by this user
    app.delete.admin         Delete any remote application

TODO: add more, like businessrules, statistics, tariffs, datasets, transactions, etc
```