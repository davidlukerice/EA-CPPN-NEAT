this["SE"] = this["SE"] || {};
(function() {
  SE.generateNameSpaceHandler = function(baseObject, baseNS) {
    return function(nsStr) {
      var parts = nsStr.split("."), parent = baseObject, i, len;
      if(parts[0] === baseNS) {
        parts = parts.slice(1)
      }
      for(i = 0, len = parts.length;i < len;++i) {
        if(typeof parent[parts[i]] === "undefined") {
          parent[parts[i]] = {}
        }
        parent = parent[parts[i]]
      }
      return parent
    }
  };
  SE.namespace = SE.generateNameSpaceHandler(SE, "SE");
  SE.CLEAR_SCREEN = false;
  SE.EDGE_SMOOTHING = false;
  SE.DEBUG_MODE = false;
  SE.DEBUG_COLLIDER_MODE = false;
  SE.DEBUG_HIT_BOXES = false;
  SE.DEBUG_TILE_LABELS = false;
  SE.error = function(msg) {
    throw msg;
  };
  SE.log = function(msg) {
    if(!SE.DEBUG_MODE) {
      return
    }
    console.log(msg)
  }
})();
(function() {
  var namespace = SE.namespace("SE"), camera;
  camera = function() {
    var self = this;
    this.canvas = document.getElementById("mainCanvas");
    this.context = this.canvas.getContext("2d");
    this.context.font = "38pt Arial";
    this.scene = null;
    this.position = {x:100, y:100};
    this.shouldClearScreen = namespace.CLEAR_SCREEN;
    /*
    $(window)["resize"](function() {
      self.canvas.width = $(window).width();
      self.canvas.height = $(window).height();
      if(!SE.EDGE_SMOOTHING) {
        var ctx = self.canvas.getContext("2d");
        ctx["imageSmoothingEnabled"] = false;
        ctx["webkitImageSmoothingEnabled"] = false;
        ctx["mozImageSmoothingEnabled"] = false
      }
    });
    $(window)["resize"]()
    */
  };
  camera.prototype = {render:function() {
    if(this.scene === null) {
      return
    }
    if(this.shouldClearScreen) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }
    this.context.save();
    this.context.translate(this.canvas.width / 2 - this.position.x, this.canvas.height / 2 - this.position.y);
    var layers = this.scene.layers, layerLen = layers.length, layerIndex = 0, entityIndex, entities;
    for(;layerIndex < layerLen;++layerIndex) {
      entities = layers[layerIndex];
      entityIndex = entities.length;
      while(entityIndex--) {
        this.renderEntity(entities[entityIndex])
      }
    }
    this.context.restore()
  }, renderEntity:function(entity) {
    if(entity.hasComponentOfType("render")) {
      entity.getComponentOfType("render").draw(this)
    }
    for(var childIndex in entity.children) {
      this.renderEntity(entity.children[childIndex])
    }
    if(SE.DEBUG_COLLIDER_MODE) {
      this.renderCollider(entity)
    }
  }, renderCollider:function(entity) {
    if(entity.hasComponentOfType("collider")) {
      entity.getComponentOfType("collider").draw(this)
    }
  }, registerScene:function(scene) {
    this.scene = scene
  }, worldToScreenSpace:function(pos) {
    return{x:pos.x - this.position.x + this.canvas.width / 2, y:pos.y - this.position.y + this.canvas.height / 2}
  }};
  namespace["Camera"] = camera
})();
(function() {
  var namespace = SE.namespace("SE.Components"), component;
  component = function() {
    this.entity = null;
    this.type = "component";
    this.subtype = ""
  };
  component.prototype = {registerEntity:function(entity) {
    this.entity = entity
  }, init:function() {
  }, start:function() {
  }, stop:function() {
  }, update:function(deltaTime) {
  }};
  namespace["Component"] = component
})();
(function($) {
  var namespace = SE.namespace("SE"), managers = SE.namespace("SE.Managers"), instance, engine;
  engine = function(options) {
    if(instance) {
      return instance
    }
    instance = this;
    var options = $.extend({}, this.defaultOptions, options);
    SE.CLEAR_SCREEN = options.CLEAR_SCREEN;
    SE.EDGE_SMOOTHING = options.EDGE_SMOOTHING;
    SE.DEBUG_MODE = options.DEBUG_MODE;
    SE.DEBUG_COLLIDER_MODE = options.DEBUG_COLLIDER_MODE;
    SE.DEBUG_HIT_BOXES = options.DEBUG_HIT_BOXES;
    SE.DEBUG_TILE_LABELS = options.DEBUG_TILE_LABELS;
    this.preInitHandler = options.preInitHandler;
    this.postInitHandler = options.postInitHandler;
    this.startHandler = options.startHandler;
    this.updateHandler = options.updateHandler;
    this.pauseHandler = options.pauseHandler;
    this.unpauseHandler = options.unpauseHandler;
    this.imageFiles = options.imageFiles;
    this.audioFiles = options.audioFiles;
    this.isPaused = false;
    this.loopHasPaused = false;
    this.oldTime = Date.now()
  };
  engine.prototype = {defaultOptions:{preInitHandler:function() {
  }, postInitHandler:function() {
  }, startHandler:function() {
  }, updateHandler:function(deltaTime) {
  }, pauseHandler:function() {
  }, unpauseHandler:function() {
  }, imageFiles:[], audioFiles:[], CLEAR_SCREEN:true, EDGE_SMOOTHING:true, DEBUG_MODE:false, DEBUG_COLLIDER_MODE:false, DEBUG_HIT_BOXES:false, DEBUG_TILE_LABELS:false}, init:function() {
    engine["Instance"] = instance;
    this.preInitHandler();
    this.imageManager = new managers.ImageManager;
    this.imageManager.addImages(this.imageFiles);
    this.audioManager = new managers.AudioManager;
    this.audioManager.addAudioFiles(this.audioFiles);
    this.sceneManager = new managers.SceneManager;
    this.currentScene = this.sceneManager.getCurrentScene();
    this.stats = {};
    if(SE.DEBUG_MODE) {
      this.stats = new Stats;
      this.stats.setMode(0);
      $("body").append(this.stats.domElement)
    }
    this.postInitHandler();
    this.imageManager.loadImages();
    this.audioManager.loadAudioFiles();
    requestNextAnimationFrame(this.loadloop)
  }, loadloop:function() {
    if(instance.imageManager.allImagesLoaded() && instance.audioManager.allAudioFilesLoaded()) {
      requestNextAnimationFrame(instance.start)
    }else {
      requestNextAnimationFrame(instance.loadloop)
    }
  }, start:function() {
    instance.currentScene.startScene();
    instance.startHandler();
    requestNextAnimationFrame(instance.animloop)
  }, animloop:function() {
    if(instance.isPaused) {
      instance.loopHasPaused = true;
      return
    }
    if(SE.DEBUG_MODE) {
      instance.stats.begin()
    }
    instance.update();
    if(SE.DEBUG_MODE) {
      instance.stats.end()
    }
    requestNextAnimationFrame(instance.animloop)
  }, update:function() {
    var newTime = Date.now();
    var diff = newTime - instance.oldTime;
    var entities = instance.currentScene.entities;
    for(var entityIndex in entities) {
      entities[entityIndex].update(diff)
    }
    instance.updateHandler(diff);
    instance.oldTime = newTime
  }, pause:function() {
    if(instance.isPaused) {
      return
    }
    instance.isPaused = true;
    instance.loopHasPaused = false;
    instance.pauseHandler()
  }, unpause:function() {
    if(!instance.isPaused) {
      return
    }
    instance.isPaused = false;
    instance.unpauseHandler();
    if(instance.loopHasPaused) {
      requestNextAnimationFrame(instance.animloop)
    }
  }};
  namespace["Engine"] = engine
})(jQuery);
(function() {
  var namespace = SE.namespace("SE"), entity;
  entity = function(scene, layer) {
    this.id = entity.getNextID();
    this.type = "entity";
    this.scene = scene;
    this.layer = layer;
    this.components = {};
    this.parent = null;
    this.children = {}
  };
  entity.prototype = {init:function() {
    var index, component;
    for(index in this.components) {
      component = this.components[index];
      component.init()
    }
    for(index in this.children) {
      this.children[index].init()
    }
  }, start:function() {
    var index, component;
    for(index in this.components) {
      component = this.components[index];
      component.start()
    }
    for(index in this.children) {
      this.children[index].start()
    }
  }, update:function(timeSinceLastUpdate) {
    for(var index in this.components) {
      this.components[index].update(timeSinceLastUpdate)
    }
    for(var key in this.children) {
      this.children[key].update(timeSinceLastUpdate)
    }
  }, registerComponent:function(component) {
    component.registerEntity(this);
    this.components[component.type] = component
  }, unregisterComponentOfType:function(type) {
    delete this.components[type]
  }, hasComponentOfType:function(type) {
    return typeof this.components[type] !== "undefined"
  }, getComponentOfType:function(type) {
    if(!this.hasComponentOfType(type)) {
      return false
    }
    return this.components[type]
  }, registerChild:function(child) {
    child.parent = this;
    child.scene = this.scene;
    this.children[child.id] = child
  }, unregisterChild:function(child) {
    child.parent = null;
    child.scene = null;
    delete this.children[child.id]
  }, registerParent:function(parent) {
    if(this.parent !== null) {
      unrigisterParent()
    }
    parent.registerChild(this)
  }, unregisterParent:function() {
    this.parent.unregisterChild(this)
  }};
  entity.nextId = 0;
  entity.getNextID = function() {
    return entity.nextId++
  };
  namespace["Entity"] = entity
})();
(function() {
  var namespace = SE.namespace("SE"), scene;
  scene = function() {
    this.entities = [];
    this.layers = [[], [], [], [], []]
  };
  scene.prototype = {registerEntity:function(entity) {
    this.entities.push(entity);
    this.addToLayer(entity)
  }, unregisterEntity:function(entity) {
    var i = this.entities.length;
    while(i--) {
      if(entity.id === this.entities[i].id) {
        this.entities.splice(i, 1)
      }
    }
    this.removeFromLayer(entity)
  }, addToLayer:function(entity) {
    this.layers[entity.layer].push(entity)
  }, removeFromLayer:function(entity) {
    var layer = this.layers[entity.layer], i = layers.length;
    while(i--) {
      if(entity.id === layer[i].id) {
        layer.splice(i, 1);
        return
      }
    }
    SE.error("NO entity found in layer " + entity.layer)
  }, startScene:function() {
    var i = this.entities.length;
    while(i--) {
      this.entities[i].start()
    }
  }};
  namespace["Scene"] = scene
})();
(function() {
  var namespace = SE.namespace("SE"), vector2;
  vector2 = function(x, y) {
    this.x = x;
    this.y = y
  };
  vector2.prototype = {add:function(vect) {
    this.x += vect.x;
    this.y += vect.y
  }, sub:function(vect) {
    this.x -= vect.x;
    this.y -= vect.y
  }, scale:function(scalar) {
    this.x *= scalar;
    this.y *= scalar
  }, inverse:function() {
    this.x *= -1;
    this.y *= -1
  }, length:function() {
    return Math.sqrt(this.lengthSquared())
  }, lengthSquared:function() {
    return this.x * this.x + this.y * this.y
  }, normalize:function(vect) {
    var length = this.length();
    if(length === 0) {
      return
    }
    this.x /= length;
    this.y /= length
  }};
  vector2.getRandomUnitVector = function() {
    var x = Math.random() * 2 - 1, y = Math.random() * 2 - 1, vect = new vector2(x, y);
    vect.normalize();
    return vect
  };
  namespace["Vector2"] = vector2
})();
(function() {
  var managers = SE.namespace("SE.Managers"), audioManager;
  audioManager = function() {
    this.audioUrls = [];
    this.audioBuffers = {};
    this.numLoadedFiles = 0;
    this.audioContext = null;
    try {
      this.audioContext = new AudioContext();
    }catch(e) {
      SE.error("Web Audio API is not supported in this browser")
    }
    this.effectsNode = this.audioContext.createGain();
    this.effectsNode.connect(this.audioContext.destination);
    this.musicNode = this.audioContext.createGain();
    this.musicNode.connect(this.audioContext.destination);
    this.currentMusicSourceNode = null
  };
  audioManager.prototype = {addAudioFile:function(url) {
    this.audioUrls.push(url)
  }, addAudioFiles:function(urls) {
    for(var i = 0;i < urls.length;++i) {
      this.addAudioFile(urls[i])
    }
  }, allAudioFilesLoaded:function() {
    return this.numLoadedFiles === this.audioUrls.length
  }, loadAudioFiles:function() {
    var i = 0;
    for(i in this.audioUrls) {
      var url = this.audioUrls[i];
      var request = new XMLHttpRequest;
      request.open("GET", url, true);
      request.responseType = "arraybuffer";
      request.onload = this.createOnAudioLoadHandlerFor(request, url);
      request.send()
    }
  }, createOnAudioLoadHandlerFor:function(request, fileName) {
    var self = this;
    return function(e) {
      self.audioContext.decodeAudioData(request.response, function(buffer) {
        ++self.numLoadedFiles;
        self.audioBuffers[fileName] = buffer
      }, function() {
        SE.error("ERROR: Couldn't load audio!")
      })
    }
  }, getAudioBuffer:function(fileName) {
    return this.audioBuffers[fileName]
  }, playSound:function(fileName) {
    var buffer = this.getAudioBuffer(fileName);
    var audioSource = this.audioContext.createBufferSource();
    audioSource.buffer = buffer;
    audioSource.connect(this.effectsNode);
    audioSource.noteOn(0)
  }, changeMusicTrack:function(fileName) {
    if(this.currentMusicSourceNode !== null) {
      this.fadeSourceNode(this.currentMusicSourceNode, false)
    }
    var buffer = this.getAudioBuffer(fileName);
    var audioSource = this.audioContext.createBufferSource();
    audioSource.buffer = buffer;
    audioSource.loop = true;
    this.currentMusicSourceNode = audioSource;
    this.fadeSourceNode(audioSource, true)
  }, fadeTime:2, fadeSourceNode:function(sourceNode, fadeIn) {
    var fadeTo = 1;
    var gainNode = null;
    if(fadeIn) {
      sourceNode.gain.value = 0;
      sourceNode.connect(this.musicNode);
      sourceNode.noteOn(0)
    }else {
      fadeTo = 0
    }
    var currTime = this.audioContext.currentTime;
    sourceNode.gain.setValueAtTime(sourceNode.gain.value, currTime);
    sourceNode.gain.linearRampToValueAtTime(fadeTo, currTime + this.fadeTime)
  }, setEffectsVolume:function(volume) {
    volume = ClampWithinValues(volume, 0, 1);
    this.effectsNode.gain.value = volume
  }, getEffectsVolume:function() {
    return this.effectsNode.gain.value
  }, setMusicVolume:function(volume) {
    volume = ClampWithinValues(volume, 0, 1);
    this.musicNode.gain.value = volume
  }, getMusicVolume:function() {
    return this.musicNode.gain.value
  }};
  managers["AudioManager"] = audioManager
})();
(function() {
  var managers = SE.namespace("SE.Managers"), imageManager;
  imageManager = function() {
    this.imageUrls = [];
    this.images = {};
    this.cache = {};
    this.numLoadedImages = 0;
    this.onImageLoadHandler = this.createOnImageLoadHandler()
  };
  imageManager.prototype = {addImage:function(url) {
    this.imageUrls.push(url)
  }, addImages:function(urls) {
    var i = urls.length;
    while(i--) {
      this.addImage(urls[i])
    }
  }, allImagesLoaded:function() {
    return this.numLoadedImages === this.imageUrls.length
  }, loadImages:function() {
    var url, image;
    for(url in this.imageUrls) {
      image = new Image;
      image.onload = this.onImageLoadHandler;
      image.src = this.imageUrls[url];
      this.images[this.imageUrls[url]] = image
    }
  }, createOnImageLoadHandler:function() {
    var self = this;
    return function() {
      ++self.numLoadedImages;
      var tempCanvas = document.createElement("canvas"), tCtx = tempCanvas.getContext("2d");
      tempCanvas.width = this.width;
      tempCanvas.height = this.height;
      tCtx.drawImage(this, 0, 0);
      self.cacheCanvas(this.outerHTML.split('"')[1], tempCanvas)
    }
  }, cacheCanvas:function(name, newCanvas) {
    this.cache[name] = newCanvas
  }, getImageFromUrl:function(url) {
    var imageCanvas = this.cache[url];
    if(typeof imageCanvas === "undefined") {
      SE.error("undefined Image: " + url)
    }
    return imageCanvas
  }};
  managers["ImageManager"] = imageManager
})();
(function() {
  var managers = SE.namespace("SE.Managers"), sceneManager;
  sceneManager = function() {
    this.scenes = [];
    this.currentSceneIndex = 0;
    var scene = new SE.Scene;
    this.scenes.push(scene)
  };
  sceneManager.prototype = {getCurrentScene:function() {
    return this.scenes[this.currentSceneIndex]
  }};
  managers["SceneManager"] = sceneManager
})();
(function() {
  var namespace = SE.namespace("SE.Components"), boxColliderComponent;
  boxColliderComponent = function(options) {
    namespace.Component.call(this);
    this.type = "collider";
    this.subtype = "polygon";
    this.options = $.extend({}, this.defaultOptions, options);
    this.transformComponent = null;
    this.renderComponent = null;
    this.polygonPoints = null;
    this.shape = null;
    this.showDebug = options.showDebug
  };
  boxColliderComponent.prototype = new namespace.Component;
  boxColliderComponent.prototype.defaultOptions = {getWidth:function() {
    return 20
  }, getHeight:function() {
    return 20
  }, isTrigger:false, onTriggerEnter:function() {
  }, onTriggerExit:function() {
  }, shouldTriggerOn:function() {
  }, showDebug:false};
  boxColliderComponent.prototype.start = function() {
    this.transformComponent = this.entity.getComponentOfType("transform");
    if(this.transformComponent === false) {
      SE.error("collider Component requires a TransformComponent")
    }
    this.renderComponent = this.entity.getComponentOfType("render");
    this.polygonPoints = [new Point(0, 0), new Point(this.options.getWidth(), 0), new Point(this.options.getWidth(), this.options.getHeight()), new Point(0, this.options.getHeight())];
    this.shape = new Polygon;
    this.shape.strokeStyle = "blue";
    for(var i in this.polygonPoints) {
      var point = this.polygonPoints[i];
      this.shape.addPoint(point.x, point.y)
    }
    this.updatePos()
  };
  boxColliderComponent.prototype.stop = function() {
  };
  boxColliderComponent.prototype.update = function(timeSinceLast) {
    this.updatePos();
    this.checkCollision()
  };
  boxColliderComponent.prototype.updatePos = function() {
    var width = this.options.getWidth();
    var height = this.options.getHeight();
    var currentPos = this.transformComponent.getPosition();
    for(var i in this.polygonPoints) {
      var thisPoint = this.polygonPoints[i];
      var polyPoint = this.shape.points[i];
      polyPoint.x = thisPoint.x + currentPos.x - width / 2;
      polyPoint.y = thisPoint.y + currentPos.y - height / 2
    }
  };
  boxColliderComponent.prototype.checkCollision = function() {
    var entities = this.entity.scene.entities;
    var mtv = null;
    var shape = null;
    var collider = null;
    var entity = null;
    for(var i in entities) {
      entity = entities[i];
      collider = entity.getComponentOfType("collider");
      if(this.shouldCollideWith(collider)) {
        mtv = this.shape.collidesWith(collider.shape);
        if(this.collisionDetected(mtv)) {
          this.handleCollision(entity)
        }
      }
    }
  };
  boxColliderComponent.prototype.shouldCollideWith = function(collider) {
    if(!collider) {
      return collider
    }
    var shouldCollide = false;
    var otherEntity = collider.entity;
    while(otherEntity.parent !== null) {
      otherEntity = otherEntity.parent
    }
    var parentEntity = this.entity;
    while(parentEntity.parent !== null) {
      parentEntity = parentEntity.parent
    }
    return otherEntity !== parentEntity
  };
  boxColliderComponent.prototype.handleCollision = function(entity) {
    SE.log("collision")
  };
  boxColliderComponent.prototype.collisionDetected = function(mtv) {
    return mtv.axis != undefined || mtv.overlap !== 0
  };
  boxColliderComponent.prototype.draw = function(renderer) {
    if(this.showDebug) {
      this.shape.stroke(renderer.context)
    }
  };
  namespace["BoxCollider"] = boxColliderComponent
})();
(function() {
  var namespace = SE.namespace("SE.Components"), boxRenderComponent;
  boxRenderComponent = function(options) {
    namespace.Component.call(this);
    this.type = "render";
    this.subtype = "box";
    this.options = $.extend({}, this.defaultOptions, options);
    this.transform = null;
    this.enabled = false
  };
  boxRenderComponent.prototype = new namespace.Component;
  boxRenderComponent.prototype.defaultOptions = {fillColor:"red", size:20};
  boxRenderComponent.prototype.start = function() {
    this.transform = this.entity.getComponentOfType("transform");
    if(this.transform === false) {
      SE.error("BoxRenderComponent requires a TransformComponent")
    }
    this.enabled = true
  };
  boxRenderComponent.prototype.stop = function() {
    this.enabled = false
  };
  boxRenderComponent.prototype.update = function(timeSinceLast) {
  };
  boxRenderComponent.prototype.draw = function(renderer) {
    if(!this.enabled) {
      return
    }
    var pos = this.transform.getPosition();
    var currentRotation = this.transform.getRotation();
    var width = this.getWidth();
    var height = this.getHeight();
    renderer.context.save();
    renderer.context.translate(pos.x, pos.y);
    renderer.context.rotate(currentRotation);
    renderer.context.fillStyle = this.options.fillColor;
    renderer.context.fillRect(-width / 2, -height / 2, width, height);
    renderer.context.restore()
  };
  boxRenderComponent.prototype.getWidth = function() {
    return this.options.size * this.transform.scale.x
  };
  boxRenderComponent.prototype.getHeight = function() {
    return this.options.size * this.transform.scale.y
  };
  namespace["BoxRender"] = boxRenderComponent
})();
(function() {
  var namespace = SE.namespace("SE.Components"), cameraComponent;
  cameraComponent = function(camera, updateSceneHandler) {
    namespace.Component.call(this);
    this.type = "camera";
    this.camera = camera;
    this.speed = 20;
    this.transformComponent = null;
    this.movementComponent = null;
    this.updateSceneHandler = updateSceneHandler;
    var self = this;
    $(window)["resize"](function() {
      self.updateSceneHandler()
    })
  };
  cameraComponent.prototype = new namespace.Component;
  cameraComponent.prototype.init = function() {
    this.transformComponent = this.entity.getComponentOfType("transform");
    if(!this.transformComponent) {
      SE.error("cameraComponent requires a transform Component")
    }
    this.movementComponent = this.entity.getComponentOfType("movement")
  };
  cameraComponent.prototype.start = function() {
    var position = this.transformComponent.getPosition();
    this.camera.position.x = position.x;
    this.camera.position.y = position.y;
    this.updateSceneHandler()
  };
  cameraComponent.prototype.stop = function() {
  };
  cameraComponent.prototype.update = function(deltaTime) {
    var currentPosition = this.camera.position, targetPosition;
    if(this.movementComponent) {
      targetPosition = this.movementComponent.getTargetPosition()
    }else {
      targetPosition = currentPosition
    }
    if(DifferenceWithinEpsilon(currentPosition.x, targetPosition.x, 2) && DifferenceWithinEpsilon(currentPosition.y, targetPosition.y, 2)) {
      currentPosition.x = targetPosition.x;
      currentPosition.y = targetPosition.y;
      return
    }
    var directionX = targetPosition.x - currentPosition.x, directionY = targetPosition.y - currentPosition.y, dist = Math.sqrt(directionX * directionX + directionY * directionY);
    directionX *= this.speed * (deltaTime / 100) / dist;
    directionY *= this.speed * (deltaTime / 100) / dist;
    currentPosition.x += directionX;
    currentPosition.y += directionY;
    this.updateSceneHandler()
  };
  namespace["Camera"] = cameraComponent
})();
(function() {
  var namespace = SE.namespace("SE.Components"), circleColliderComponent;
  circleColliderComponent = function(options) {
    namespace.Component.call(this);
    this.type = "collider";
    this.subtype = "circle";
    this.options = $.extend({}, this.defaultOptions, options);
    this.transformComponent = null;
    this.renderComponent = null;
    this.shape = null;
    this.collidersInTrigger = {};
    this.showDebug = options.showDebug
  };
  circleColliderComponent.prototype = new namespace.Component;
  circleColliderComponent.prototype.defaultOptions = {getRadius:function() {
    return 10
  }, isTrigger:false, onTriggerEnter:function(entity) {
  }, onInTrigger:function(entity) {
  }, onTriggerExit:function(entity) {
  }, shouldTriggerOn:function(entity) {
    return true
  }, showDebug:false};
  circleColliderComponent.prototype.start = function() {
    this.transformComponent = this.entity.getComponentOfType("transform");
    if(this.transformComponent === false) {
      throw"collider Component requires a TransformComponent";
    }
    this.renderComponent = this.entity.getComponentOfType("render");
    this.shape = new Circle(0, 0, this.options.getRadius());
    if(this.options.isTrigger) {
      this.shape.strokeStyle = "red"
    }else {
      this.shape.strokeStyle = "blue"
    }
    this.updatePos()
  };
  circleColliderComponent.prototype.stop = function() {
  };
  circleColliderComponent.prototype.update = function(timeSinceLast) {
    this.updatePos();
    this.checkCollision()
  };
  circleColliderComponent.prototype.updatePos = function() {
    var currentPos = this.transformComponent.getPosition();
    this.shape.x = currentPos.x;
    this.shape.y = currentPos.y
  };
  circleColliderComponent.prototype.checkCollision = function() {
    var entities = this.entity.scene.entities;
    var mtv = null;
    var shape = null;
    var collider = null;
    var entity = null;
    var triggered = false;
    if(this.options.isTrigger) {
      for(var i in this.collidersInTrigger) {
        this.collidersInTrigger[i].stillInTrigger = false
      }
    }
    for(var i in entities) {
      entity = entities[i];
      collider = entity.getComponentOfType("collider");
      if(this.shouldCollideWith(collider)) {
        mtv = this.shape.collidesWith(collider.shape);
        if(this.collisionDetected(mtv)) {
          if(this.handleCollision(entity)) {
          }
          triggered = true
        }
      }
    }
    if(this.options.isTrigger) {
      for(var i in this.collidersInTrigger) {
        var collider = this.collidersInTrigger[i];
        if(collider.stillInTrigger) {
          this.options.onInTrigger(collider)
        }else {
          delete this.collidersInTrigger[i];
          this.options.onTriggerExit(collider)
        }
      }
    }
  };
  circleColliderComponent.prototype.shouldCollideWith = function(collider) {
    if(!collider) {
      return collider
    }
    var shouldCollide = false;
    var otherEntity = collider.entity;
    while(otherEntity.parent !== null) {
      otherEntity = otherEntity.parent
    }
    var parentEntity = this.entity;
    while(parentEntity.parent !== null) {
      parentEntity = parentEntity.parent
    }
    return otherEntity !== parentEntity
  };
  circleColliderComponent.prototype.handleCollision = function(entity) {
    if(this.options.isTrigger) {
      if(this.options.shouldTriggerOn(entity)) {
        if(typeof this.collidersInTrigger[entity.id] === "undefined") {
          this.collidersInTrigger[entity.id] = {stillInTrigger:true, entity:entity};
          this.options.onTriggerEnter(entity)
        }else {
          this.collidersInTrigger[entity.id].stillInTrigger = true
        }
        return true
      }
    }else {
    }
    return false
  };
  circleColliderComponent.prototype.collisionDetected = function(mtv) {
    return mtv.axis != undefined || mtv.overlap !== 0
  };
  circleColliderComponent.prototype.draw = function(renderer) {
    if(this.showDebug) {
      this.shape.stroke(renderer.context)
    }
  };
  namespace["CircleCollider"] = circleColliderComponent
})();
(function() {
  var namespace = SE.namespace("SE.Components"), mouseClickInputComponent;
  mouseClickInputComponent = function(options) {
    namespace.Component.call(this);
    this.type = "input";
    this.subtype = "mouse";
    this.options = $.extend({}, this.defaultOptions, options);
    this.camera = null;
    this.isEnabled = true;
    this.clickHandler = this.createClickHandler()
  };
  mouseClickInputComponent.prototype = new namespace.Component;
  mouseClickInputComponent.prototype.defaultOptions = {camera:null, entity:null};
  mouseClickInputComponent.prototype.init = function() {
  };
  mouseClickInputComponent.prototype.start = function() {
    this.registerCamera(this.options.camera);
    this.registerEntity(this.options.entity)
  };
  mouseClickInputComponent.prototype.stop = function() {
  };
  mouseClickInputComponent.prototype.update = function(timeSinceLast) {
  };
  mouseClickInputComponent.prototype.disable = function(timeSinceLast) {
    this.isEnabled = false
  };
  mouseClickInputComponent.prototype.enable = function(timeSinceLast) {
    this.isEnabled = true
  };
  mouseClickInputComponent.prototype.registerCamera = function(camera) {
    if(this.camera !== null) {
      $(this.camera.canvas).unbind("click", this.clickHandler)
    }
    this.camera = camera;
    $(this.camera.canvas).click(this.clickHandler)
  };
  mouseClickInputComponent.prototype.registerEntity = function(entity) {
    this.entity = entity
  };
  mouseClickInputComponent.prototype.createClickHandler = function() {
    var self = this;
    var clickHandler = function(e) {
      if(!self.isEnabled) {
        return
      }
      var clickLoc = self.windowToCanvas(e.clientX, e.clientY);
      var transformComp = self.entity.getComponentOfType("transform");
      var movementComp = self.entity.getComponentOfType("movement");
      var pos = transformComp.getPosition();
      var currentCanvasPos = self.camera.worldToScreenSpace(pos);
      movementComp.setTargetPosition({x:pos.x + (clickLoc.x - currentCanvasPos.x), y:pos.y + (clickLoc.y - currentCanvasPos.y)})
    };
    return clickHandler
  };
  mouseClickInputComponent.prototype.windowToCanvas = function(x, y) {
    var canvas = this.camera.canvas;
    var bbox = canvas.getBoundingClientRect();
    return{x:x - bbox.left * (canvas.width / bbox.width), y:y - bbox.top * (canvas.height / bbox.height)}
  };
  namespace["MouseClickInput"] = mouseClickInputComponent
})();
(function() {
  var namespace = SE.namespace("SE.Components"), movementComponent;
  movementComponent = function(options) {
    namespace.Component.call(this);
    this.type = "movement";
    options = $.extend({}, this.defaultOptions, options);
    this.isMoving = false;
    this.transform = null;
    this.animationComponent = null;
    this.onStopHandler = null;
    this.tempReturnedTargetPosition = {x:options.targetPos.x, y:options.targetPos.y};
    this.targetOffset = {x:options.targetPos.x, y:options.targetPos.y};
    this.speed = options.speed;
    this.targetRotation = options.targetRotation;
    this.rotationSpeed = options.rotationSpeed;
    this.rotationDirection = options.rotationDirection
  };
  movementComponent.prototype = new namespace.Component;
  movementComponent.prototype.defaultOptions = {targetPos:{x:0, y:0}, speed:20, targetRotation:0, rotationSpeed:Math.PI, rotationDirection:1};
  movementComponent.prototype.init = function() {
    this.animationComponent = this.entity.getComponentOfType("animation");
    this.transform = this.entity.getComponentOfType("transform");
    if(this.transform === false) {
      SE.error("MovementComponent requires a TransformComponent")
    }
  };
  movementComponent.prototype.start = function() {
  };
  movementComponent.prototype.stop = function() {
  };
  movementComponent.prototype.update = function(timeSinceLast) {
    if(this.targetPositionInMargin()) {
      this.teleportToTarget()
    }else {
      this.stepTowardTargetPosition(timeSinceLast)
    }
    if(this.targetRotationInMargin()) {
      this.transform.rotation = this.targetRotation
    }else {
      this.stepTowardTargetRotation(timeSinceLast)
    }
  };
  movementComponent.prototype.marginDivider = 12;
  movementComponent.prototype.targetPositionInMargin = function() {
    var width = this.getWidth();
    var height = this.getHeight();
    var currentOffset = this.transform.offset;
    return DifferenceWithinEpsilon(currentOffset.x, this.targetOffset.x, width / this.marginDivider) && DifferenceWithinEpsilon(currentOffset.y, this.targetOffset.y, height / this.marginDivider)
  };
  movementComponent.prototype.getHeight = function() {
    if(this.entity.hasComponentOfType("render")) {
      var renderComponent = this.entity.getComponentOfType("render");
      return renderComponent.getHeight()
    }
    return 10
  };
  movementComponent.prototype.getWidth = function() {
    if(this.entity.hasComponentOfType("render")) {
      var renderComponent = this.entity.getComponentOfType("render");
      return renderComponent.getWidth()
    }
    return 10
  };
  movementComponent.prototype.teleportToTarget = function() {
    this.transform.offset.x = this.targetOffset.x;
    this.transform.offset.y = this.targetOffset.y;
    if(this.isMoving && this.animationComponent !== false) {
      this.animationComponent.startAnimation("idle")
    }
    this.isMoving = false;
    if(this.onStopHandler !== null) {
      this.onStopHandler();
      this.onStopHandler = null
    }
  };
  movementComponent.prototype.stepTowardTargetPosition = function(timeSinceLast) {
    this.isMoving = true;
    if(this.animationComponent !== false) {
      this.animationComponent.startAnimation("walk")
    }
    var currentOffset = this.transform.offset;
    var direction = {x:this.targetOffset.x - currentOffset.x, y:this.targetOffset.y - currentOffset.y};
    var dist = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    direction.x /= dist;
    direction.y /= dist;
    currentOffset.x += direction.x * this.speed * timeSinceLast / 100;
    currentOffset.y += direction.y * this.speed * timeSinceLast / 100
  };
  movementComponent.prototype.rotationMargin = Math.PI / 100;
  movementComponent.prototype.targetRotationInMargin = function() {
    return DifferenceWithinEpsilon(this.transform.rotation, this.targetRotation, this.rotationMargin)
  };
  movementComponent.prototype.stepTowardTargetRotation = function(timeSinceLast) {
    var diffMagnitude = Math.abs(this.targetRotation - this.transform.rotation);
    this.transform.rotation += this.normalizedRotationDirection() * this.rotationSpeed * timeSinceLast / 1E3;
    var newDiffMagnitude = Math.abs(this.targetRotation - this.transform.rotation);
    if(newDiffMagnitude > diffMagnitude) {
      this.transform.rotation = targetRotation
    }
  };
  movementComponent.prototype.normalizedRotationDirection = function() {
    if(this.rotationDirection >= 0) {
      return 1
    }
    return-1
  };
  movementComponent.prototype.getTargetPosition = function() {
    if(this.entity.parent !== null && this.entity.parent.hasComponentOfType("movement")) {
      var parentMovementComp = this.entity.parent.getComponentOfType("movement");
      var parentTargetPos = parentMovementComp.getTargetPosition();
      this.tempReturnedTargetPosition.x = parentTargetPos.x;
      this.tempReturnedTargetPosition.y = parentTargetPos.y
    }else {
      this.tempReturnedTargetPosition.x = 0;
      this.tempReturnedTargetPosition.y = 0
    }
    var currentOffset = this.transform.offset;
    this.tempReturnedTargetPosition.x += currentOffset.x;
    this.tempReturnedTargetPosition.y += currentOffset.y;
    return this.tempReturnedTargetPosition
  };
  movementComponent.prototype.setTargetPosition = function(pos) {
    if(this.entity.parent !== null && this.entity.parent.hasComponentOfType("movement")) {
      var parentMovementComp = this.entity.parent.getComponentOfType("movement");
      var parentTargetPos = parentMovementComp.getTargetPosition();
      pos.x -= parentTargetPos.x;
      pos.y -= parentTargetPos.y
    }
    this.targetOffset.x = pos.x;
    this.targetOffset.y = pos.y
  };
  namespace["Movement"] = movementComponent
})();
(function() {
  var namespace = SE.namespace("SE.Components"), transformComponent;
  transformComponent = function(options) {
    namespace.Component.call(this);
    this.type = "transform";
    options = $.extend({}, this.defaultOptions, options);
    this.offset = {x:options.startPos.x, y:options.startPos.y};
    this.tempReturnedPosition = {x:this.offset.x, y:this.offset.y};
    this.rotation = options.rotation;
    this.scale = {x:options.scale.x, y:options.scale.y}
  };
  transformComponent.prototype = new namespace.Component;
  transformComponent.prototype.defaultOptions = {startPos:{x:0, y:0}, rotation:0, scale:{x:1, y:1}};
  transformComponent.prototype.getPosition = function() {
    if(this.entity.parent !== null && this.entity.parent.hasComponentOfType("transform")) {
      var parentTransformComp = this.entity.parent.getComponentOfType("transform");
      var parentPos = parentTransformComp.getPosition();
      this.tempReturnedPosition.x = parentPos.x;
      this.tempReturnedPosition.y = parentPos.y
    }else {
      this.tempReturnedPosition.x = 0;
      this.tempReturnedPosition.y = 0
    }
    this.tempReturnedPosition.x += this.offset.x;
    this.tempReturnedPosition.y += this.offset.y;
    return this.tempReturnedPosition
  };
  transformComponent.prototype.setPosition = function(pos) {
    if(this.entity.parent !== null && this.entity.parent.hasComponentOfType("transform")) {
      var parentTransformComp = this.entity.parent.getComponentOfType("transform");
      var parentPos = parentTransformComp.getPosition();
      pos.x -= parentPos.x;
      pos.y -= parentPos.y
    }
    this.offset.x = pos.x;
    this.offset.y = pos.y
  };
  transformComponent.prototype.getRotation = function() {
    return this.rotation
  };
  transformComponent.prototype.setRotation = function(new_rotation) {
    this.rotation = new_rotation
  };
  transformComponent.prototype.setScale = function() {
    return this.scale
  };
  transformComponent.prototype.getScale = function(new_scale) {
    this.scale = new_scale
  };
  namespace["Transform"] = transformComponent
})();
