# angular-jointjs-graph

This is an AngularJS project generated with [yo angular generator](https://github.com/yeoman/generator-angular)
version 0.11.1.

## Build & development

The package is available in the bower registry under the name `angular-joinjs-graph`. To use it
in your project, include it in your `bower.json` manifest as dependency:
 
```javascript
"dependencies": {
  "angular-joinjs-graph": "^0.1.0"
}
```

Depending on your build process, you may need to include the scripts the projects depends on manually 
in your main file. The compiled project scripts and styles are located under `dist/scripts` and
`dist/styles` respectively and come in minified versions as well. Please ensure that the assets in 
`dist/images` are also served.

If you are using Ruby on Rails, you can include the package in your project as a gem using `rails-assets`.
In your Gemfile, include `rails-assets` as a gem source: 

```
source 'https://rails-assets.org'
```

Then include the gem:

```
gem 'rails-assets-angular-jointjs-graph'
```

Since the package depends on several libraries, you must include them manually in your application.js file
(normaly found in `app/assets/javascripts`):

```
//= require jquery
//= require angular
//= require angular-resource
//= require lodash
//= require backbone
//= require joint/joint.nojquerynobackbone
//= require angular-jointjs-graph/angular-jointjs-graph
```

Similarly, include the provided styles in your main styles file:

```
//= require "angular-jointjs-graph/angular-jointjs-graph.scss"
```

Please note that although the extension of the styles is .scss, the styles have been compiled 
to plain CSS upon build and there is no need to process them further.

If you wish to build the scripts from source, run `grunt` in the project root.

## Testing

Running `grunt test` will run the unit tests with karma.

## Overview

The goal of the framework is to visually organize different classes of user specified
entities by creating relationships between them in a graph structure. The main
features of the framework are:

 * Creation of new graph nodes via drag and drop
 * Creation of links (relationships) between graph nodes
 * Association of graph nodes to existing or newly created backend models
 * Selection and removal of existing graph components (nodes and links)
 * Persistence of the serialized graph structure
 
The visual representation of the graph structure is implemented via the [JointJS](http://www.jointjs.com)
library and makes uses of SVG markup. The framework uses [AngularJS](http://www.angularjs.org/) 
to encapsulate much of the JointJS code and to provide extension points for the user for the definition 
of entity types and the corresponding templates used to build the graph. Those extension points 
rely heavily on the `ngResource` module for all the communication with the user backend, and 
require `$resource` objects to be provided by the user. Therefore, some experience with AngularJS 
and the `ngResource` module in particular as well as with SVG markup and styling is expected.

## Backend requirements

The main prerequisite for using the framework is the existence of a RESTful API (referred to as "backend"
throughout the rest of the documentation) using JSON as request and response payload data format. Since
the framework expects `$resource` objects as input that can have arbitrary URLs set, no exact structure 
of the API is imposed, however the following resources are required:
 
 * A single 'graph' resource, providing `GET` and `PUT` operations, for retrieving and updating the 
   serialized structure of the graph
 * One or more 'entity' resources, providing `GET` for retrieving a JSON array of existing entities, 
   and `POST` and `DELETE` operations for creating new and removing existing entities
 * A single 'entity relationships' resource, providing `GET` for retrieving a JSON array of existing 
   relationships, and `POST` and `DELETE` operations for creating new and removing existing relationships
   
Although not required by the framework, it makes sense to additionally implement PUT operations for the 
latter two resources, since it will likely be desirable to be able to modify their properties, e. g. when a
resource is selected.

## Usage

There are several steps required to use the framework:

  1. Declare the `angular-jointjs-graph` module as dependency to your main application module
  2. Insert the required HTML/SVG markup
  3. Define a factory returning a configuration object
  4. Issue an event carrying the `$resource` objects for the entity and relationship backend models 
  5. Define optional factories providing callbacks invoked during the entity/link creation process
  6. Define factories providing user-specified SVG attributes for the different entity and relationship classes
  
The following sections describe the actions required by each step in detail.

### Including the module

Include the module in your application as usual:

```javascript
angular.module('app', ['angular-jointjs-graph']);
```

### Markup

The following snippet gives an overview of the markup structure.

```html
<graph config-factory="ConfigFactoryName">
  <graph-node>
    SVG markup goes here
  <graph-node>
  <graph-side-panel-tools>
    <graph-new-entity entity-identifier="firstEntity">
      <div class="entityOneIcon"></div>Other content...
    </graph-new-entity>
    <graph-existing-entities entity-identifier="firstEntity">
      {{entity.name}} Other content...
    </graph-existing-entities>
  </graph-side-panel-tools>
  <graph-side-panel-details>
    Content
  </graph-side-panel-details>
</graph>
```

The main `graph` directive serves as a container and all other directives require it as a parent. It 
encapsulates the main chart drawing area and is styled with `position: absolute`  and 100% width
and height, relying on the user-specified parent for proper positioning and size. The directive exposes
several methods on its scope that are visible to its children and uses events to notify actions like
selection of a chart element. All the methods and events are documented in [this](#scope-interface) chapter. 
The directive takes a single attribute as an argument, which must be the name of a registered factory/service 
returning a configuration object for the framework, as described in the next chapter, [Configuration](#config).

The `graph-node` directive uses and SVG template and transclusion, providing a basic layout and an
extension point for custom styling of the chart elements representing entities. The topic is discussed in
more detail in the section [Graph node SVG template](#graph-node-svg).

The `graph-side-panel-tools` directive provides visual means to create new entities on the graph via drag
and drop. It is a container for the `graph-new-entity` and `graph-existing-entities` directives. The former 
directive is meant for creating new graph entities that don't have backend models associated with them yet; 
the latter lists all 'existing' backend models and allows creation of new graph entities without creating
a new entity model in the backend.

Note that both directives may be used several times - this depends on how many different entity models the 
user has defined and wants to be present on the graph. Both directive require an `entity-identifier`
argument. It is used to differentiate between the different entity model classes, invoking `POST` ot `PUT` 
actions on the proper `$resource` objects and passing the corresponding set of model properties to the JointJS
models, enabling custom styling and behavior for the different graph nodes.

The `graph-existing-entities` directive contains an `ng-repeat` loop iterating over all the entities retrieved for the
given entity identifier. The retrieval happens after the `graph` directive has received a `graphResources`
event, which is described in detail in the [Initialization](#init) section. It exposes an `entity` object 
in its scope that may be used to bind model properties to the transcluded view, e.g. name, entity type or 
any other model property present on the backend model.

Including the `graph-side-panel-details` directive is optional; it has an empty template that transcludes all
content. It is meant as a convenience container for any custom content the user may wish to associate with
the entities on the graph - e.g. detailed info upon selection.

### <a name="graph-node-svg"></a>Graph node SVG template

The framework defines a very basic template for presenting the entities on the graph. It consists
of a plain rectangle, a connection port area, from which a new link can be dragged away, and a node 
remove area, which removes the node upon click:

```SVG
<g class="graph-node-template">
  <rect width="260" height="38"/>
  <g ng-transclude></g>
  <g class="connection-port">
    <circle class="outer" cx="15" cy="19" r="6"/>
    <circle class="inner" cx="15" cy="19" r="2.5"/>
  </g>
  <g class="remove-element">
    <path class="cross" transform="translate(235, 15)" opacity="0.4" d="M0,0 L10,10 M10,0 L0,10"/>
  </g>
</g>
```

A simple way to enhance this template is to transclude content into it and style the
transcluded elements via CSS and/or attributes passed via a factory, as described in the section
[SVG attribute factories](#attr-factories).

```html
<graph-node>
  <text class="name"></text>
  <text class="country"></text>
<graph-node>
```

If the user wishes to present a custom look that can't be achieved by simply transcluding
content, the whole template may be overwritten by using Angular's `$templateCache` and
registering a new template named `angular-joints-graph/templates/graphNode`. However,
the framework relies on the two classes `connection-port` and `remove-element` to
trigger link creation and node removal events, so the new template should contain elements
with those two classes in order for these events to be issued and handled properly.

### <a name="config"></a>Configuration

The framework accepts configuration parameters provided by a factory returning a plain 
javascript object. It can have an arbitrary name which must be passed to the `graph` 
directive as described in the previous section. The framework can be used without 
specifying such factory, although this may only be useful for testing/debugging 
purposes. All the keys in the returned object are similarly optional. In its fullest 
form, the configuration object looks as following:

```javascript
angular.module('app')
  .factory('ConfigFactoryName', [
    function() {
      return {
        entityModelProperties: {
          firstEntity: ['property1', 'property2'...],
          secondEntity: ['property3', 'property4'...]
        },
        entityCreationCallbacks: {
          firstEntity: 'FirstEntityCallbacks',
          secondEntity: 'SecondEntityCallbacks'
        },
        modelIdKey: 'uuId',
        linkModelProperties: [],
        linkCreationCallbacks: 'LinkCallbacks',
        entityMarkupParams: 'EntityMarkup',
        linkMarkupParams: 'LinkMarkup'
      };
    }
  ]);
```

There are a couple of important points to note regarding the object's structure. First of all,
the `entityModelProperties` key points to a hash mapping every entity identifier used as 
argument to the `graphNewEntity` or `graphExistingEntities` directives to an array of property 
names. These property names will be used to transfer values from the backend models (`$resource`
objects) to the JointJS models on the graph, enabling custom styling and behavior. Suppose
you have used the following markup in the `graph` directive:

```html
<graph config-factory="GraphConfig">
  <graph-side-panel-tools>
    <graph-new-entity entity-identifier="project">
      <div class="projectIcon"></div>
    </graph-new-entity>
    <graph-new-entity entity-identifier="lead">
      <div class="leadIcon"></div>
    </graph-new-entity>
    ...
  </graph-side-panel-tools>
</graph>
```

You may then define different arrays with properties that will be carried over from the
corresponding backend models to the graph nodes:

```javascript
entityModelProperties: {
  project: ['name', 'launch_date', 'duration'...],
  lead: ['name', 'team'...]
}
```

Every node on the graph ('project' or 'lead') will receive an attribute object called 
`backendModelParams` which will contain the keys listed for the corresponding entity identifier
with the values extracted from the backend models. These properties can be used to pass styling 
attributes to the JointJS models conditionally or define link creation restrictions as described 
in section [SVG attribute factories](#attr-factories).

The `entityCreationCallbacks` key may contain a map defining a factory name for every
entity identifier that is passed to a `graphNewEntity` directive. These factories are
used to provide callbacks invoked before and after the entity model has been created on the server. 
See section [Entity creation callbacks](#entity-creation-callbacks) for details.

The rest of the keys in the configuration object are described below.

  * `modelIdKey`: This property specifies the name of the ID key used in all backend models,
    e.g. `uuid`. If not specified, defaults to `id`.

  * `linkModelProperties`: Similar to `entityModelProperties`, this array should specify 
    model properties that will be available in the JointJS link models when links are
    created between entities on the graph.
 
  * `linkCreationCallbacks`: If present should be the name of a factory returning callbacks
    invoked during link creation, similar to `entityCreationCallbacks` See 
    [Link creation callbacks](#link-creation-callbacks).

  * `entityMarkupParams`: A factory returning SVG attributes used to style the
    graph nodes associated with entity models. The factory will receive a hash object
    with the keys defined in `entityModelProperties` and the values taken from the
    corresponding backend entity model.

  * `linkMarkupParams`: A factory returning SVG attributes used to style the
    links between graph nodes associated with relationship models. The factory will
    receive a hash object with the keys defined in `linkModelProperties` and the values 
    taken from the corresponding backend relationship model.

### <a name="init"></a>Initialization

The main directive in the module, `graph`, defines a `$scope.$on` event listener triggered by an event
named `graphResources`. The `data` object attached to the event should have the following structure:

```javascript
{
  graph: $resource,
  entities: {
    entityIdentifierOne: $resource,
    entityIdentifierTwo: $resource
  },
  entityRelations: $resource
}
```

All of the `$resource` objects are expected to be constructor objects as returned by a `$resource` 
factory call, e.g. they should expose `query()`, `get()`, etc. methods as described in the `ngResource`
module documentation, and not their `$`-prefixed counterparts defined on instances.

The `graph` resource is used to fetch/update the serialized graph structure, therefore a custom 
`update` action is expected to be defined on the class, as in the following example:
 
```javascript
var GraphResource = $resource(url, [paramDefaults], {
  update: {
    method: 'PUT'
  }
});
```

It is assumed that a `GET` request on this resource will return a single object with a `content`
field containing the actual serialized data. Before a graph structure is created, `null` is an
allowed value for the content field. The following example is a valid response for a `GET` action
on the graph resource object:

```javascript
{
  id: 1,
  content: null,
  created_at: "2015-03-26T11:35:02.684Z",
  updated_at: "2015-03-26T11:35:02.684Z"
}
```

The `entities` and `entityRelations` resources are expected to return arrays
upon `GET` requests. Those resources are used to fetch, create and delete entities and
the connections between them. No custom actions are expected to be defined on any of the resource
objects provided, however it is up to the end user configure the correct URLs and parameters
for each of them in order for the respective requests to succeed - the framework will not make
any assumptions about resource locations and backend API structure.

### <a name="entity-creation-callbacks"></a>Entity creation callbacks

The process of creating a new entity on the graph can be summarized in the following steps:

 1. Decide based on the drop event whether the new graph node should be associated with
    an existing backend model or a new model should be created.
 2. Create a wrapper around the JointJS model constructor. If a new entity model is to
    be created, prototype a method on the wrapper that will be used to make a `POST` to the server 
    and create the backend model. The `$resource` object for the call will be chosen from the resources
    provided during the [inititalization]('#init') stage.
 3. Instantiate the wrapper and add the returned node to the graph.
 4. Invoke the wrapper method on the model instance and add the returned backend model to the
    existing entities list, initially hiding it from view.
 
During step 2., two callback methods will be invoked if a factory has been provided by the user.
An example factory definition follows:

```javascript
angular.module('app')
  .factory('EntityOneFactory', [
    function() {
      return {
        postDataFn: function(jointJsModel) {
          return { entity_type: 'EntityOne' };
        },
        modelUpdateCallback: function(jointModel, serverResponse) {
          jointModel.attr('.createdAt', { text: serverResponse.created_at });
        }
      };
    }
  ]);
```

The two fields in the returned object are described below: 

  * `postDataFn`: A function returning a hash carrying additional data for the `POST` request. It will
    be invoked with a single argument, the JointJS model, which allows additional info, like the source
    and target ids in the case of a link, to be included in the `POST` data. See example in the 
    [Link creation callbacks](#link-creation-callbacks) section.

  * `modelUpdateCallback`: A callback function that will be invoked after the `POST` request has
    succeeded. It is called with two arguments, the JointJS model and the server response (which is 
    a `$resource` instance).

### <a name="link-creation-callbacks"></a>Link creation callbacks

The link factory should comply to the same interface as described in the previous section. The
example given below illustrates a common use case - supplying the ids of the source and 
target graph nodes to the server upon link creation. The object returned by the `postDataFn`
callback will be merged on the `$resource ` object. Note the injection of the `JointGraph` 
service, which is a simple wrapper around a `window.joint.dia.Graph` instance. A complete list
of all services exposed by the framework can be found in the section 
[Interface methods and events](#scope-interface).

```javascript
angular.module('app')
  .factory('LinkFactory', ['JointGraph',
    function(JointGraph) {
      return {
        postDataFn: function(model) {
          var sourceModel = JointGraph.getCell(model.get('source').id),
              targetModel = JointGraph.getCell(model.get('target').id),
            sourceModelId = sourceModel.get('backendModelParams').uuId,
            targetModelId = targetModel.get('backendModelParams').uuId;
          return {
            source_entity_id: sourceModelId,
            target_entity_id: targetModelId
          };
        }
      };
    }
  ]);
```

If you wish to update the JointJS link model after the backend model is created
(e.g. in order change the color of the link), provide a `modelUpdateCallback` just as 
in the case described in the previous section. 

### <a name="attr-factories"></a>SVG attribute factories

### <a name="scope-interface"></a>Interface methods and events

The following events are emitted by the graph directive:

  * `applicationError`: Will be triggered by a failed server action. The original XHR error data 
    is available in the associated data object carried with the event in a field named `errData`.
    
The following events are broadcast by the graph directive:

  * `graphEntitiesLoaded`: Will be triggered when the arrays with entity models for all specified 
    identifiers have been fetched from the server. The data object for the event is an object with 
    the key-value pairs being the identifiers and the respective `$resource` arrays.
  * `graphEntityRelationsLoaded`: Will be triggered when the array with entity relation models has
    been fetched. The event data is the array itself.
  * `graphResourcesLoaded`: Will be triggered after all resources have been loaded. The event has
    no data attached.
  * `graphSelection`: Will be triggered when the selected graph element changes. The data object
    carried with the event has the following structure:
    
    ```javascript
    {
      isChartNode: Boolean,
      selectedResource: $resource,
      selectedCellId: String,
      masterResource: $resource,
      entityIdentifier: String
    }
    ```
    
    The `isChartNode` property denotes whether the selected graph element is a node or link; the
    `selectedResource` property is the actual entity or link model corresponding to the graph element.
    `selectedCellId` is the JointJs unique identifier string for the graph element and may be used
    to retrieve the JointJs model or view if this should be required. Since the framework keeps
    internal state of the selected resource in `masterResource`, it is not desirable to modify it -
    it is included in the selection object for logging/debugging purposes only. The `entityIdentifier` will
    be set to the corresponding value for entity models and will be undefined for links.
    
The following methods are available in the scope of the `graph` directive and in all inheriting scopes:

  * `saveGraph()`: This method serializes the existing graph structure and issues a `PUT` request
    to the server with the string payload assigned to the `content` field of the provided `$resource`
    object, as described in the [initialization](#init) section.
  * `clearCellSelectionAndRevert()`: Removes the selected state from the currently selected graph element
     and reverts the selected resource to the value stored in the `masterResource` value. This value is set 
     initially upon selection or by subsequent calls to `syncSelection()`. This method will fire the
     `graphSelectionEvent` with a `null` data object, since there will be no valid selection afterwards.
  * `revertSelection()`: Reverts the selected resource to the value stored in the `masterResource` value.
    The selected state of the graph element isn't altered. The `graphSelectionEvent` will be fired with 
    the updated selection object.
  * `syncSelection()`: Copies the current state of the `selectedResource` entity model to `masterResource`.
    The `graphSelectionEvent` will be fired with the updated selection object.
  * `selectEntity(entity, identifier)`: Selects an entity model programmatically, even if there is no
    associated JointJs model present on the graph. In this case, the `selectedCellId` of the selection
    object will be undefined. This method makes it possible to deal with selection of entity models
    listed in the existing list which haven't been dragged onto the graph yet.
