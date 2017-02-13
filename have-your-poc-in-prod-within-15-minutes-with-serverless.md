# Have your MVP running in prod within 15 minutes with Serverless

I always feel guilty when I suddenly motivate myself to go to the gym, then have all the painful toughts
like going out in the cold, being sweaty and feeling stiff afterwards, and decide that I'd rather stay in bed watching my favourite series.

I have the same mixed feelings when I get an idea of project and then get discouraged -even before getting started-
thinking about having to provision a server and deploy my code to see it live and used by others than myself.

But recently, I discovered Serverless, a framework that helps you deploy your code in seconds.
It is based on [Amazon Lambda](http://docs.aws.amazon.com/lambda/latest/dg/welcome.html).

- It means you can deploy single functions in the cloud.
- They will respond to events you have registered, and scale automatically.
- And you'll be charged only when the functions are running.

The framework is said to relieve lambda functions of its mail painpoint (the AWS console, the heavy configuration), to allow developers to work with more familiar standards.

Sounds like a really nice promise that would dismiss all my excuses not to go on with any of my ideas.

I did some research to understand the new fuss about Serverless architectures and why people opinion is still torn about it.
I decided to test it on a fun project, and experience how promissing it actually is.

I ended up creating a chatbot game on Facebook Messenger, to help my colleagues learn the name of everybody in the company.

I started with this tutorial: [Building a Facebook Messenger Chatbot with Serverless](https://serverless.com/blog/building-a-facebook-messenger-chatbot-with-serverless/).
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

 - You'll only have to code the logic of the bot that can easily fit into lambda functions.
 - You won't pay for a full server to have it running and answering a user a few times a day.
 - You can easily collect feedback from your users and iterate over your idea.
 - And if you get successfull all your users will not see any difference in terms of performance.


## Having a chatbot running in prod in 15 minutes with Serverless

### Requirements

Before staring the tutorial, make sure you have :

- An account set on AWS ~3min + 24h validation

  - Be aware that a credit card is required to sign up.
  - You'll have the free tier for one year,
  - You'll need to wait 24 hours to have your account validated.
  - Be patient, you can watch your favorite series or go to the gym while you wait ;)
   
- **Node v4 or higher to install Serverless** ~2min
- **The API Key & Secret of an IAM user with programmatic access and AdministratorAccess** ~2min

  - The paragraph [Creating AWS Access Keys in the Serverless doc](https://serverless.com/framework/docs/providers/aws/guide/credentials#creating-aws-access-keys) is faily explicit for that.
 
- **Configure Serverless with your AWS credentials** ~1min

  - I recommand using the [serverless config credentials command](https://serverless.com/framework/docs/providers/aws/guide/credentials#setup-with-serverless-config-credentials-command).
  You'll avoid having to install aws-cli or managing environment variables

### Tutorial
