mnubo PubNub BLOCK
======

This repository contains examples of code that can be used in PubNub BLOCKS to
use the mnubo's SmartObjects platform.

---------

# Usage

1. Follow the BLOCKS Hello World tutorial.
2. Replace the Event Handler code by the content of one of the files in [dist](dist/)

# Examples

* postEvents.js - on incoming message post an event to mnubo
* createObject.js - on incoming message create an object if it does not exist
* createOwner.js - on incoming message create an object if it does not exist


Note:
-----
PubNub has a limit of 3 external calls per BLOCK, if you want more, you can request
it [here](https://support.pubnub.com/support/solutions/articles/14000046950-why-am-i-receiving-execution-calls-exceeds-error-when-i-run-my-block-event-handler-).