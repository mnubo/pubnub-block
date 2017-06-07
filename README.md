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

# Development

PubNub BLOCKs are available from a catalog. When you install a BLOCK from the catalog, a
template is used to generate an Event Handler for your code. Currently, mnubo offers 3
different BLOCKs and their template is available from this repository: 
[blocks-catalog-mnubo](https://github.com/pubnub/blocks-catalog-mnubo). The code was taken from
the [dist](dist/) folder.

If you want to update the code from a template:

* make a pull request here (ensure clean code using build tools)
* make a pull request on the PubNub repository