# Have your MVP Running in Prod within 15 Minutes with Serverless

I always feel guilty when I suddenly motivate myself to go to the gym, then have all the painful thoughts
like going out in the cold, being sweaty and feeling stiff afterwards, and decide that I'd rather stay in bed watching my favorite series.

I have the same mixed feelings when I get an idea of project and then get discouraged -even before getting started-
thinking about having to provision a server and deploy my code to see it live and used by others than myself.

But recently, I discovered [__Serverless__](https://serverless.com/), a framework that helps you deploy your code in seconds.
It is based on [Amazon Lambda](http://docs.aws.amazon.com/Lambda/latest/dg/welcome.html).

The framework is said to relieve Lambda functions of its main pain points (the AWS console, the heavy configuration), to allow developers to work with more familiar standards.

Looks like a really nice promise that would dismiss all my excuses not to go on with any of my ideas:

* Focus on coding, deploy single functions in the cloud.
* Don't manage any server. AWS handles provisioning and scaling.
* Pay only when the functions are running.

I decided to test it on a fun project, and experience how promising it actually is.

I ended up creating a chatbot game on Facebook Messenger, to help my colleagues learn the name of everybody in the company.

I started with this tutorial: [Building a Facebook Messenger Chatbot with Serverless](https://serverless.com/blog/building-a-facebook-messenger-chatbot-with-serverless/)
posted on the Serverless blog, which quickly had me play with my phone talking to my chatbot.

But I have to admit I had to struggle a little to fully understand all the magic behind the framework.

In this article, you'll find:
* How Serverless works
* A benchmark on when to use Serverless, an EC2 or a Heroku server.

## What Cool Projects can you Do with Serverless?

Lambda functions are handy when
* You want to have a cron job running without having a full server dedicated to it.

  Ex: a custom [IFTTT](https://ifttt.com/) or [Zapier](https://zapier.com/)
* You need an automatic data processing job.

  Ex: create thumbnails for profile pictures uploaded to your website

  __Funnier__: a backend for a chatbot

    Building a chatbot is a great mean to test an idea and develop an MVP.

    The advantage is that you only have to focus on the backend,
    since the frontend and delivery is granted by the messaging service you'll be using.

    And with Serverless,

     * Only code the logic of the bot
     * Quickly iterate as deploying is super fast
     * Spend little money while testing
     * Keep focusing on your service if you get successful as AWS handles scaling.

## Having a Chatbot Running in Prod in 15 Minutes with Serverless

### Requirements

Before starting the tutorial, make sure you have:

* __An account set on AWS__ ~3min + 24h validation

  * Be aware that a credit card is required to sign up.
  * You'll have the free tier for one year,
  * You'll need to wait 24 hours to have your account validated.
  * Be patient, you can watch your favorite series or go to the gym while you wait ;)

* __Node v4 or higher to install Serverless__ ~1min

 `npm install -g serverless` will do the job

* __The API Key & Secret of an IAM user with programmatic access and AdministratorAccess__ ~2min

  The paragraph [Creating AWS Access Keys in the Serverless doc](https://serverless.com/framework/docs/providers/aws/guide/credentials#creating-aws-access-keys) is faily explicit for that.

* __Configured Serverless with your AWS credentials__ ~1min

 I recommend using the [`serverless config credentials` command](https://serverless.com/framework/docs/providers/aws/guide/credentials#setup-with-serverless-config-credentials-command).
  You'll avoid having to install `aws-cli` or managing environment variables

* For the chatbot, __a Facebook Developer account__ ~1min

 3min if you don't have a [Facebook account](https://www.facebook.com/login/?next=https%3A%2F%2Fdevelopers.facebook.com%2F) yet

* For the chatbot, __a Facebook Page that you own__ ~2min

 Use the same account as your Facebook Developer account [to create your page](https://www.facebook.com/pages/create/?ref_type=pages_browser)

 The Page gives an identity to your chatbot, you can't have one without it.

### Tutorial

#### Init your project

```shell
$ sls create --template aws-nodejs --path my-first-chatbot
```
This creates two files in the directory `my-first-chatbot`:
```
├── my-first-chatbot
│   ├── handler.js
│   └── serverless.yml
```

_I used Node.js for my bot. If you prefer Python, use `aws-python` instead._

First take a look at the `serverless.yml` file.
It is the configuration file of your project.
Lots of options are commented in the file, all you need for now is the following:

```yml
service: my-first-chatbot

provider:
  name: aws
  runtime: nodejs4.3
  region: eu-central-1 # Choose the closest data center from your end users

functions:
  hello: # the name of your Lambda function
    handler: handler.hello # The node function that is exported from the handler.js module
                           # It is used as handler by AWS Lambda
                           # That's to say the code excecuted when your Lambda runs.
```

So far you have declared the `hello` Lambda function which will be deployed somewhere in the Frankfort AWS cloud.

You can already invoke it locally from your shell to check that it works:

```shell
$ sls invoke local -f hello
{
    "statusCode": 200,
    "body": "{\"message\":\"Go Serverless v1.0! Your function executed successfully!\",\"input\":\"\"}"
}
```

Notice that you can pass an `input` when you invoke your Lambda function, either inline or with a `.json` or `.yml` file

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

* The `context` variable contains runtime information of the Lambda function that is executing. We won't need it here but if you are curious you can check [the documentation about the context object on AWS](http://docs.aws.amazon.com/Lambda/latest/dg/nodejs-prog-model-context.html).

* The `callback` variable returns information to the caller.
  If no callback then the return value is null.

#### Code the logic to communicate with your Facebook chat.

You need a webhook (aka web callback or HTTP push API) to first exchange credentials with your Messenger app so that you can start receiving events from it (incoming messages, postback ...), and responding to them.

Credentials exchange is done through an HTTP GET event set for your Lambda function.

The HTTP GET event requires an endpoint.

Luckily, Serverless allows you to create one simply by writing a few lines of configuration.

Rename your `hello` function to `webhook` and add the following config to your `serverless.yml`:

```yml
...

functions:
  webhook:
    handler: handler.webhook
    events: # All events that will trigger your webhook Lambda function
      - http:
          path: webook # Sets the path of your endpoint generated with API Gateway
          method: GET
          integration: Lambda # A method of integration to exchange requests and responses
                              # between the HTTP endpoint and your webhook Lambda function
                              # The `Lambda` method here works well with Messenger's events
```

Then update your `handler.js` file to enable authorisation:

```node.js
module.exports.webhook = (event, context, callback) => {
  if (event.method === 'GET') {
    // Facebook app verification
    if (event.query['hub.verify_token'] === 'SECRET_TOKEN_YOU_NEED_TO_CHANGE_AND_PROTECT' && event.query['hub.challenge']) {
      return callback(null, parseInt(event.query['hub.challenge']));

    } else {
      const response = {
        statusCode: 403,
        body: JSON.stringify({
          message: 'Invalid Token',
          input: event,
        }),
      };

      return callback(null, response);
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
 };
 ```

 * Don't forget to rename your exported Lambda function `webhook`!
 * Make sure to choose a strong `SECRET_TOKEN_YOU_NEED_TO_CHANGE_AND_PROTECT`.

  It is the token that you will have to declare to your Messenger app to enable communication with the chat.
 * The `hub.challenge` is an integer code that Messenger sends you along with the token.
 * Test your handler locally:

 ```shell
  $ sls invoke local -f webhook -p -d "{\"method\":\"GET\",\"query\":{\"hub.verify_token\":\"SECRET_TOKEN_YOU_NEED_TO_CHANGE_AND_PROTECT\",\"hub.challenge\":123456}}"
123456
  $ sls invoke local -f webhook -p -d "{\"method\":\"GET\",\"query\":{\"hub.verify_token\":\"BAD_TOKEN\",\"hub.challenge\":123456}}"
{
    "statusCode": 403,
    "body": "{\"message\":\"Invalid Token\",\"input\":{\"method\":\"GET\",\"query\":{\"hub.verify_token\":\"BAD_TOKEN\",\"hub.challenge\":123456}}}"
}
 ```

  _I recommend you create `.yml` or `.json` files to invoke your Lambda function locally.
  It will make your life easier :)_

Now that you'll be able to receive events from Messenger, let's update your Lambda function to actually handle them.

Add HTTP POST config to your `serverless.yml`:

```yml
...

functions:
  webhook:
    handler: handler.webhook
    events:
      - http:
          path: webook
          method: GET
          integration: Lambda
      - http:
          path: webook
          method: POST
          integration: Lambda
```

To handle the POST requests we will need some more preparation:

* Create your Messenger app

 For that,
  * [Create an app from your Facebook developer account](https://developers.facebook.com/apps/)
  * Add the Messenger product to your app
   You can access all Facebook products from the left menu __"Add a product"__.

* Get a page token to be able to post messages on behalf of your page (and have your chatbot respond automatically)

 Once you have added Messenger to your app, configure Messenger parameters (accessible from left menu also):
  * Under __"Token Generation"__, select your Facebook Page
  * Grant access to it with your Facebook account
  * Save the token you get for later.

* Add axios to your project to be able to send responses from your bot.

 ```shell
 $ npm install axios
 ```

 Use a `package.json` file if you want to manage your `node_modules`

 ```
 ├── my-first-chatbot
 │   ├── node_modules
 │   ├── handler.js
 │   └── serverless.yml
 ```

Now you can edit your `handler.js`:

```node.js
const axios = require('axios');
const fbPageToken = 'YOUR_FACEBOOK_PAGE_TOKEN';
const fbPageUrl = `https://graph.facebook.com/v2.6/me/messages?access_token=${fbPageToken}`;

module.exports.webhook = (event, context, callback) => {
  if (event.method === 'GET') {
    // ...
  } else if (event.method === 'POST' && event.body.entry) {
      event.body.entry.map((entry) => {
        // Messenger can send several entry for one event.
        // The list contains all the information on the event.
        entry.messaging.map((messagingItem) => {
          // Each entry can have several messaging data within each event.
          // For instance if a user sends several messages at the same time.
          // messagingItem contains:
          //  - the sender information,
          //  - the recipient information,
          //  - the message information,
          //  - other specific information
          const senderId = messagingItem.sender.id;

          // handle text message
          if (messagingItem.message && messagingItem.message.text) {
          const payload = {
            recipient: {
              id: senderId
            },
            message: {
              text: `You say "${messagingItem.message.text}", I say: Hi, let's chat :)`
            }
          };
          axios
            .post(fbPageUrl, payload)
            .then((response) => {
              response = {
                statusCode: response.status,
                body: JSON.stringify({
                  message: response.statusText,
                  input: event,
                }),
              };
              return callback(null, response);
            })
            .catch((error) => {
              const response = {
                statusCode: error.response.status,
                body: JSON.stringify({
                  message: error.response.statusText,
                  input: event,
                }),
              };
              return callback(null, response);
            });
        }
      });
    });
  } else {
    // ...
  }
 };
 ```

 You can try to call your Lambda locally, but you won't be able to get a successful response unless you know a real sender ID.

 ```shell
 $ sls invoke local -f webhook -d "{\"method\":\"POST\",\"body\":{\"entry\":[{\"messaging\":[{\"sender\":{\"id\":\"YOUR_SENDER_ID\"},\"message\":{\"text\":\"Hello\"}}]}]}}"
{
    "statusCode": 400,
    "body": "{\"message\":\"Bad Request\",\"input\":{\"method\":\"POST\",\"body\":{\"entry\":[{\"messaging\":[{\"sender\":{\"id\":\"YOUR_SENDER_ID\"},\"message\":{\"text\":\"Hello\"}}]}]}}}"
}
 ```

 This means it is time to deploy your project for the first time!

#### Deploy

As easy as:

```shell
$ sls deploy
```

You'll see the following logs appear:

```shell
Serverless: Packaging service...
Serverless: Uploading CloudFormation file to S3...
Serverless: Uploading service .zip file to S3 (134.73 KB)...
Serverless: Updating Stack...
Serverless: Checking Stack update progress...
.................................
Serverless: Stack update finished...
Service Information
service: my-first-chatbot
stage: dev
region: eu-central-1
api keys:
  None
endpoints:
  GET - https://ENDPOINT_ID.execute-api.eu-central-1.amazonaws.com/dev/webook
  POST - https://ENDPOINT_ID.execute-api.eu-central-1.amazonaws.com/dev/webook
functions:
  my-first-chatbot-dev-webhook: arn:aws:Lambda:eu-central-1:ID:function:my-first-chatbot-dev-webhook
```

__Congratulations, your webhook is now available from anywhere!__

What happened exactly?

Notice that you have a new folder in your project directory:

 ```
 ├── my-first-chatbot
 │   ├── .serverless
 │   │   ├── cloudformation-template-create-stack.json
 │   │   ├── cloudformation-template-update-stack.json
 │   │   └── my-first-chatbot.zip
 │   ├── node_modules
 │   ├── handler.js
 │   └── serverless.yml
 ```

Let's examine the first half of the logs to understand:
* Serverless reads your `serverless.yml` file to create two CloudFormation files in the directory `.serverless`:
 - one to create a [CloudFormation on AWS](https://aws.amazon.com/cloudformation/?nc1=h_ls) through your AWS account
 - one to create all the AWS resources you need to have your Lambda function working
  (Here it includes the two API Gateway endpoints you need for your webhook and other credentials settings)
* Serverless packaged all the files in your directory except the `serverless.yml` file, zip it to `.serverless/my-first-chatbot.zip`
* Serverless then uploads the new files created to an S3 Bucket in the region specified in your `serverless.yml` and creates or update all the resources listed in the CloudFormation update file (including the Lambda function of course)

What you can do now:
* Invoke your deployed Lambda function

 ```shell
  $ sls invoke -f webhook -p -d "{\"method\":\"GET\",\"query\":{\"hub.verify_token\":\"SECRET_TOKEN_YOU_NEED_TO_CHANGE_AND_PROTECT\",\"hub.challenge\":123456}}"
  $ sls invoke -f webhook -p -d "{\"method\":\"GET\",\"query\":{\"hub.verify_token\":\"BAD_TOKEN\",\"hub.challenge\":123456}}"
  $ sls invoke -f webhook -d "{\"method\":\"POST\",\"body\":{\"entry\":[{\"messaging\":[{\"sender\":{\"id\":\"YOUR_SENDER_ID\"},\"message\":{\"text\":\"Hello\"}}]}]}}"
 ```

* Test that your Lambda function is triggered when there is a call to one of the endpoints that just have been created

 Use curl for instance to query the endpoint `https://ENDPOINT_ID.execute-api.eu-central-1.amazonaws.com/dev/webook`

* Better, test your chatbot live!

#### Try it ! Send your first message to your chatbot

Final settings for your Messenger app:

 * Configure Messenger parameters to __"Setup Webhooks"__ under __"Webhooks"__ now that your endpoint is available.

 * Use the endpoint url as __"Callback URL"__, and your `SECRET_TOKEN_YOU_NEED_TO_CHANGE_AND_PROTECT`.
 * Subscribe to `messages` and other Messenger events you might want to handle.
 * __"Verify and Save"__: Facebook will call the GET endpoint with the token your gave him to subscribe your webhook to the the app
 * Once done, in the same __"Webhook"__ section, select your Facebook page for subscription: you'll now listen to the events incoming from this page

Now for the chatbot to send you automatic messages, you need to start the conversation first (otherwise you'll get a 403)

* If your page is public

  Simply find your page in Messenger, and send your first message!

* If not

  Go to the Facebook page and start a conversation from there

__Your app is now in prod!__

You can start iterating. Facebook allows you to grant permission to testers to use your app before it is validated and available by anyone.

## Benchmarking MVP options

### Pros and cons

I rated Serverless, EC2 and Heroku based on three criteria:

      | Serverless | EC2 | Heroku
----- | ---------- | --- | -------
Scalability | ++ | + | -
Customization and services | + | ++ | -
Ease of use | ok | ok | +

On Heroku,
* You need to configure manually the scale of your infrastructure.
* You have less integrations than on AWS
* But it is more user friendly than AWS EC2
* You have less new concepts to understand than Serverless.

On the other hand, once you get your hand with Serverless or EC2s, you can implement your service faster and more easily.

### Pricing
I'll consider two scenarios:

1. The custom IFFT: low traffic and light computing memory
2. A data processing job running every day every hour

 a. Requiring less than 500MB RAM

 b. Requiring more than 500MB RAM

      | Serverless | EC2 | Heroku
----- | ---------- | --- | -------
1 | 0.30€/month | 3€/month | Free for 1 app
2.a | 0.67€/month | 4€/month | 7€/month
2.b | 1.35€/month | 8€/month | 25€/month

* Heroku is still a good plan in case 1.
* AWS is a better bargain if:
  * You need a cron job every hour
  * You need lots of computing memory
* Serverless is cheaper than EC2.

__That's it for now !__

I'll be happy to have your opinion or feedback if you tried using Serverless or AWS Lambda, or if you have any question or suggestion about this tutorial.
Feel free to leave a comment :)

_Sources for the benchmark_
* [AWS Lambda Pricing in Context - A Comparison to EC2](https://www.trek10.com/blog/lambda-cost/)
* [AWS Lambda Pricing Calculator](https://s3.amazonaws.com/lambda-tools/pricing-calculator.html) and [AWS Simple Monthly Calculator](http://calculator.s3.amazonaws.com/index.html)
* [Heroku Pricing Page](https://www.heroku.com/pricing)
