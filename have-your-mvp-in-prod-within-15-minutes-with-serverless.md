# Have your MVP running in prod within 15 minutes with Serverless

I always feel guilty when I suddenly motivate myself to go to the gym, then have all the painful toughts
like going out in the cold, being sweaty and feeling stiff afterwards, and decide that I'd rather stay in bed watching my favourite series.

I have the same mixed feelings when I get an idea of project and then get discouraged -even before getting started-
thinking about having to provision a server and deploy my code to see it live and used by others than myself.

But recently, I discovered Serverless, a framework that helps you deploy your code in seconds.
It is based on [Amazon Lambda](http://docs.aws.amazon.com/lambda/latest/dg/welcome.html).

* It means you can deploy single functions in the cloud.
* They will respond to events you have registered, and scale automatically.
* And you'll be charged only when the functions are running.

The framework is said to relieve lambda functions of its mail painpoint (the AWS console, the heavy configuration), to allow developers to work with more familiar standards.

Sounds like a really nice promise that would dismiss all my excuses not to go on with any of my ideas.

I did some research to understand the new fuss about Serverless architectures and why people opinion is still torn about it.
I decided to test it on a fun project, and experience how promissing it actually is.

I ended up creating a chatbot game on Facebook Messenger, to help my colleagues learn the name of everybody in the company.

I started with this tutorial: [Building a Facebook Messenger Chatbot with Serverless](https://serverless.com/blog/building-a-facebook-messenger-chatbot-with-serverless/)
posted on the Serverless blog, which quilcky had me play with my phone talking to my chatbot.

But I have to admit I had to struggle a little to fully understand all the magic behind the framework.

In this article, I'll try to give you more explaination on how Serverless makes it work, so that you can use it to any of your project.

I'll alswo share with you my conclusions on when to use Serverless rather than a EC2 or a Heroku server. Skip to this part if you are not yet ready to try a new fun project.

I'll be happy to have your opinion or feedback if you tried using Serverless or AWS Lambda, or if you have any question or suggestion about my tutorial.
Feel free to leave a comment :)

## What cool projects can you do with Serverless ?

I don't have enough overview to talk about running big projets on AWS lambda, but I understand that lamdba functions are handy when you want to have a cron job running without having a full server dedicated to it.
Or if you want to have automatic data processing jobs.

For instance if you want a custom IFTTT or Zapier, to have the most futurist smart home.

Or for instance if you want to have a program that regularly collects information,
and notify you if there is any relevant changes (the new hottest italian restaurant to try for example).

Why did I choose to make a chatbot ? Because I believe it is the most relevant idea that fits the Serverless concept.

Building a chatbot let's you focus on the backend service you want to implement,
since the frontend and delivery is granted by the messaging service you'll be using.

This means that to test your idea,

 * You'll only have to code the logic of the bot that can easily fit into lambda functions.
 * You won't pay for a full server to have it running and answering a user a few times a day.
 * You can easily collect feedback from your users and iterate over your idea.
 * And if you get successfull all your users will not see any difference in terms of performance.


## Having a chatbot running in prod in 15 minutes with Serverless

### Requirements

Before staring the tutorial, make sure you have :

* __Minimum knowledge of either Node.js or Python, or even Java and C#__

  * These are the supported languages for AWS Lambda
  * I'll use Node.js in this tutorial

* __An account set on AWS__ ~3min + 24h validation

  * Be aware that a credit card is required to sign up.
  * You'll have the free tier for one year,
  * You'll need to wait 24 hours to have your account validated.
  * Be patient, you can watch your favorite series or go to the gym while you wait ;)
   
* __Node v4 or higher to install Serverless__ ~1min

 * `npm install -g serverless` will do the job

* __The API Key & Secret of an IAM user with programmatic access and AdministratorAccess__ ~2min

  * The paragraph [Creating AWS Access Keys in the Serverless doc](https://serverless.com/framework/docs/providers/aws/guide/credentials#creating-aws-access-keys) is faily explicit for that.
 
* __Configured Serverless with your AWS credentials__ ~1min

 * I recommand using the [serverless config credentials command](https://serverless.com/framework/docs/providers/aws/guide/credentials#setup-with-serverless-config-credentials-command).
  You'll avoid having to install aws-cli or managing environment variables
  
* For the chatbot, __a Facebook Developper account__ ~1min
 * 3min if you don't have a [Facebook account](https://www.facebook.com/login/?next=https%3A%2F%2Fdevelopers.facebook.com%2F) yet

### Tutorial

#### Init your project

```shell
$ sls create --template aws-nodejs --path my-first-chatbot
```
This creates two files in the directory `my-first-chatbot` :
```
├── my-first-chatbot
│   ├── handler.js
│   └── serverless.yml
```
First take a look at the `serverless.yml` file.
It is the configuration file of your project.
Lots of options are commented in the file, all you need for now is the following :

```yml
service: my-first-chatbot

provider:
  name: aws
  runtime: nodejs4.3
  region: eu-central-1 # Choose the closest data center from your end users

functions:
  hello: # the name of your lambda function
    handler: handler.hello # The node function that is exported from the handler.js module
                           # It is used as handler by AWS lambda
                           # That's to say the code excecuted when your lambda runs.
```

So far you have declared the `hello` lambda function written in Node.js which will be deployed somewhere in the Frankfort AWS cloud.
You can already invoke it locally from your shell to check that it works :
```shell
$ sls invoke local -f hello
{
    "statusCode": 200,
    "body": "{\"message\":\"Go Serverless v1.0! Your function executed successfully!\",\"input\":\"\"}"
}
```

Notice that you can pass an `input` when you invoke your lambda function, either inline or with a `.json` or `.yml` file
```shell
$ sls invoke local -f hello -d "my data"
{
    "statusCode": 200,
    "body": "{\"message\":\"Go Serverless v1.0! Your function executed successfully!\",\"input\":\"my data\"}"
}

$ sls invoke local -f hello -p "path_to_my_data_file.yml"
{
    "statusCode": 200,
    "body": "{\"message\":\"Go Serverless v1.0! Your function executed successfully!\",\"input\":\"{\"data\":\"Content of my data file as json\"}\"}"
}
``` 

Now you can take a look at the `handler.js` file to see that the hello function simply returns a JSON 200 response.
```node.js
'use strict';

module.exports.hello = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  };

  callback(null, response);
};
```


* The `event` variable contains all data from the event that triggered your function.

* The `context` variable contains runtime information of the Lambda function that is executing. We won't need it here but if you are curious you can check [the documentation about the context object on AWS](http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html).

* The `callback` variable returns information to the caller.
  If no callback then the return value is null. 
  
#### Set up the webhook to communicate with your Facebook chat
 
You need a webhook (aka web callback or HTTP push API) to first exchange credentials with your Messenger app so that you can start receiving events from it (incomming messages, postback ...).

This is done through an HTTP GET event set for your lamdba function.

The HTTP GET event needs requires an endpoint.

Luckily, serverless allows you to create one simply by writing a few lines of configuration.

Rename your `hello` function to `webhook` and add the following config to your `serverless.yml` :
```yml
functions:
  webhook:
    handler: handler.webhook
    events: # All events that will trigger your webhook Lambda function
      - http: 
          path: webook # Sets the path of your endpoint generated with API Gateway
          method: GET
          integration: lambda # A method of integration to exchange requests and responses
                              # between the HTTP endpoint and your webhook Lambda function
                              # The `lambda` method here works well with Messenger's events 
```

Then update your `handler.js` file to enable authorisation :
```node.js
module.exports.webhook = (event, context, callback) => {
  if (event.method === 'GET') {
    // facebook app verification
    if (event.query['hub.verify_token'] === 'SECRET_TOKEN_YOU_NEED_TO_CHANGE_AND_PROTECT' && event.query['hub.challenge']) {
      return callback(null, parseInt(event.query['hub.challenge']));

    } else {
      return callback(new Error('[403] Invalid token'));
    }
  } else {
    const response = {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Bad Request',
        input: event,
      }),
    };

    return callback(null, response);
  }
  
  ```