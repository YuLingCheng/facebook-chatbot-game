# Chatbot game to get to know Theodoers

## Requirement

Have serverless installed set with your AWS credentials

## Installation
```
npm install
cp serverless.yml.dist serverless.yml
```

Fill in your the FB_APP_TOKEN, FB_PAGE_ACCESS_TOKEN and MONGO_URI in `functions.webhook.environment`

You can change `provider.region` if you want to pick another data center.

## Deploy

You can check that your function is ok with the following command:
```
sls invoke local -f webhook -p <path_to_file>.yml
```

To deploy:
```
sls deploy
```

## TODO

- Improve performance
- Update people database automatically or at least more easily (than by hand)

## Command Helpers

Set initial message
```
curl -X POST -H "Content-Type: application/json" -d '{
  "setting_type":"greeting",
  "greeting":{
    "text":"Hello {{user_first_name}}, connais-tu bien les Theodoers ?"
  }
}' "https://graph.facebook.com/v2.6/me/thread_settings?access_token=EAACmMLVpCD4BAHk6jXJhrVBnTaIsKC48jvbK7tGWoIWGFrXIqPdrL3ZBawSZABrHwY81HZBzvzApoAYGJMZBXqg51oFHRGXWfPe5QJAjXHKCJh1SZCPcJwDPJ22ZCrktp0afGQfZA4ZARfUY3aThzWiIFYloMgUWlV0LiaMD9aSIBwZDZD"
```

Add initial call to action
```
curl -X POST -H "Content-Type: application/json" -d '{
  "setting_type":"call_to_actions",
  "thread_state":"new_thread",
  "call_to_actions":[
    {
      "payload":"INIT_HELP"
    }
  ]
}' "https://graph.facebook.com/v2.6/me/thread_settings?access_token=EAACmMLVpCD4BAHk6jXJhrVBnTaIsKC48jvbK7tGWoIWGFrXIqPdrL3ZBawSZABrHwY81HZBzvzApoAYGJMZBXqg51oFHRGXWfPe5QJAjXHKCJh1SZCPcJwDPJ22ZCrktp0afGQfZA4ZARfUY3aThzWiIFYloMgUWlV0LiaMD9aSIBwZDZD"   
```   
