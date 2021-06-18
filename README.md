# pubcid.js
SharedId (FKA Publisher Common ID) client-side javascript

## Overview

SharedId (FKA PubCID) is a privacy centric first party cookie solution. Built with consumer privacy in mind. SharedId does not sync IDs across domains so the IDs your domain generates are yours to share with whom you choose. Because the user IDs generated are site specific, there is no degradation of these IDs over time, improving user match rates.  Additionally, latency issues generally caused by multiple call outs to various parties are significantly reduced, improving user experience, viewability and earnings.

Publishers that have implemented SharedId have seen an immediate lift in earnings and improvement in user interaction on their domain. This solution is open source, free to use, and does not require any consortium memberships.

## How It Works

The pubcid.js script generates a v4 UUID locally when a new user visits the website and saves it locally.  By default the id is saved in the browser's local storage, but it can also be configured to use cookies instead.  

Javascripts that supports Publisher Common ID will look for window.PublisherCommonId object and call the getId() method to obtain the id.  

## Install
    $ npm install
    
## Run Unit Tests
    $ npm run test
    
## Build
    $ npm run build
    
This creates _pubcid.min.js_ in the _dist_ directory.
    

## Configuration

If there are no custom configurations, then just include the script and it'll use the default values.

    <script type="text/javascript" src="//myserver.com/pubcid.min.js"></script>


If it needs to be customized, then define pubcid_options object before inclusion of the script.  For example, to switch from using local storage to cookie: 

    <script type="text/javascript">
       window.pubcid_options = {type: 'cookie'};
    </script>
    <script type="text/javascript" src="//myserver.com/pubcid.min.js"></script>
    
### List of Options

| Param | Type | Description | Example |
| ---------- | ---------| ---------------------- | --------- |
| expInterval | decimal | Expiration interval in minutes.  Default is 525600, or 1 year | 525600 |
| type | string | Type of storage.  It's possible to specify one of the following: 'html5', 'cookie'.  Default is 'html5' priority, aka local storage, and fall back to cookie if local storage is unavailable.  | 'cookie' |
| create | boolean | If true, then an id is created automatically by the script if it's missing.  Default is true.  If your server has a component that generates the id instead, then this should be set to false | true |
| extend | boolean | If true, the the expiration time is automatically extended whenever the script is executed even if the id exists already.  Default is true.  If false, then the id expires from the time it was initially created.  | true |
| pixelUrl | string | This is the only needed there is a server component, which has a special end-point that creates/extends the id as a cookie.  It's not useful when local storage is used. | /wp-json/pubcid/v1/extend/ |

### Sample Configurations

#### Standalone

Always use cookies and create an ID that expires in 30 days after creation.

    { 
        type: 'cookie',
        extend: false,
        expInterval: 43200
    }

#### With Server\-Side Cookie

The configuration options only controls the behaviors on the Javascript side, the server-side has its own configuration that's done separately.  Both sets need to coordinate with each other.

Script creates the cookie, but leave it to the server-side to extend the cookie.  No special endpoint needed because the server checks all pages.

    { 
        type: 'cookie'
    }
    
Script creates cookie, and server extends expiration thru an endpoint.

    { 
        type: 'cookie',
        pixelUrl: '/wp-json/pubcid/v1/extend/
    }
    
Server creates cookie once and let it expires before creating again.

    { 
        type: 'cookie',
        pixelUrl: '/wp-json/pubcid/v1/extend/',
        create: false,
        extend: false
    }

## Usage

Load script and read the pubcid.  Consent checking takes place during script initialization.  If there is consent, then a pubcid is generated and stored in the browser if there isn't one already.  

```html
<script src="//myserver.com/pubcid.min.js"></script>
<script>
    var pubcid = PublisherCommondId.getId();
    console.log(pubcid); // ex: f9e17bd4-4bda-4c2e-a656-6468ae2a61c2
</script>
```

Alternatively getIdWithConsent can be used which will check consent again during reading.  A callback function is required.

```html
<script src="//myserver.com/pubcid.min.js"></script>
<script>
    PublisherCommondId.getIdWithConsent(
        function(pubcid) {
            console.log(pubcid); // ex: f9e17bd4-4bda-4c2e-a656-6468ae2a61c2
        }
    );
</script>
```

Async queueing is also supported.  The parameter is an array where the first item is the method name, followed by the rest of parameters.

```html
<script>
    var PublisherCommonId = PublisherCommonId || {};
    PublisherCommonId.que = PublisherCommonId.que || [];
</script>
<script src="//myserver.com/pubcid.min.js" async></script>
<script>
    var callback = function(pubcid) {
        console.log(pubcid); // ex: f9e17bd4-4bda-4c2e-a656-6468ae2a61c2
    };
    
    PublisherCommondId.que.push(['getIdWithConsent', callback]);
</script>
```

Queueing a function

```html
<script>
    var PublisherCommonId = PublisherCommonId || {};
    PublisherCommonId.que = PublisherCommonId.que || [];
</script>
<script src="//myserver.com/pubcid.min.js" async></script>
<script>
    var test = function() {
        var pubcid = PublisherCommonId.getId();
        console.log(pubcid); // ex: f9e17bd4-4bda-4c2e-a656-6468ae2a61c2
    };
    
    PublisherCommondId.que.push(test);
</script>
```

See available methods in [pubcidModule.js](src/lib/pubcidModule.js).
