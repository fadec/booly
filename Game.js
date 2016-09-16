'use strict';

var AudioContext = window.AudioContext
    || window.webkitAudioContext
    || null

function oneOf(array)
{
    return array[Math.floor(Math.random() * array.length)]
}

function playBling (audioContext)
{
    if (!audioContext)
	return
    let now = audioContext.currentTime
    let tone = audioContext.createOscillator()
    let frequencyCurve = new Float32Array([440,880])
    tone.connect(audioContext.destination)
    tone.start(now)
    tone.frequency.setValueCurveAtTime(frequencyCurve, now, 0.1)
    tone.stop(now+0.1)
}

function playSad (audioContext)
{
    if (!audioContext)
	return
    let now = audioContext.currentTime
    let tone = audioContext.createOscillator()
    let frequencyCurve = new Float32Array([440,220])
    tone.connect(audioContext.destination)
    tone.start(now)
    tone.frequency.setValueCurveAtTime(frequencyCurve, now, 1)
    tone.stop(now+1)
}

class Formula extends THREE.Mesh
{
    constructor (font)
    {
	super ()
	this.font = font
	this.material = new THREE.MeshStandardMaterial({color:0xffffff})
	this.castShadow = true
	this.questionState = Formula.unanswered
    }
    
    set (value)
    {
    	this.text = '' + value
    	this.value = eval(value)

    	var geometry = new THREE.TextGeometry(this.text, {font: this.font,
    							  size:1, height:0.1,
    							  curveSegments: 4,
    							  bevelEnabled:true,
    							  bevelThickness:0.2,
    							  bevelSize: 0.05})
    	geometry.center()
    	this.geometry.fromGeometry(geometry)
    	return this
    }

    randomize ()
    {
	return this.set(oneOf(Formula.generators)())
    }

    step (speed)
    {
	switch (this.questionState) {
	case Formula.unanswered:
	    this.position.y -= speed
	    break
	case Formula.correct:
	    if (this.value)
		this.position.x += speed * 10
	    else
		this.position.x -= speed * 10
	    break
	case Formula.incorrect:
	    break
	}
    }
}

Formula.unanswered = 0
Formula.correct = 1
Formula.incorrect = 2

Formula.generators = [
    function ()
    {
    	return Math.random() < 0.5 ? 'false' : 'true'
    },
    function ()
    {
    	let a = Math.floor(Math.random() * 2)
    	let b = Math.floor(Math.random() * 2)
    	return '' + a + '==' + b
    },
    function ()
    {
    	return oneOf(['undefined', 'null', 'NaN', 'Infinity'])
    },
    function ()
    {
    	return '\'Spaz\''
    },
    function ()
    {
    	return '[1]==[1]'
    },
    function ()
    {
    	return 'false^true'
    },
    function ()
    {
    	let a = Math.floor(Math.random() * 10)
    	return '' + a + oneOf(['==', '===']) + '\'' + a + '\''
    },
    function ()
    {
    	return '' + Math.floor(Math.random() * 2)
    },
    function ()
    {
    	let a = Math.floor(Math.random())
    	let b = Math.floor(Math.random())
    	let op = oneOf(['^', '|', '&', '/']) 
    	let s = '' + a + op + b
    	if (Math.random() < 0.5)
    	    s += '==0'
	return s
    },
    function ()
    {
	return 'Infinity/0'
    },
    function ()
    {
    	let a = Math.floor(Math.random() * 100)
    	let b = Math.floor(Math.random() * 10)
    	let s = '' + a + '%' + b
    	if (Math.random() < 0.5)
    	    s += '==0'
	return s
    },
]

class Platform extends THREE.Mesh
{
    constructor ()
    {
	super ()
	this.notty = true
	
	this.trueMaterial = new THREE.MeshStandardMaterial({color: 0x1155ff, transparent: true, opacity: 0.7, shading: THREE.FlatShading })
	this.falseMaterial = new THREE.MeshStandardMaterial({color: 0xaa5533, transparent: true, opacity: 0.7, shading: THREE.FlatShading})
	
	this.geometry = new THREE.CylinderBufferGeometry(8,9,1,6,1,false)
	this.material = this.falseMaterial
	this.receiveShadow = true
    }

    step (pressed)
    {
	this.notty = pressed
	if (this.notty) {
	    this.material = this.falseMaterial
	} else {
	    this.material = this.trueMaterial
	}
	this.rotateY(0.005 * (this.notty ? 1 : -1))
    }

    answer (formula)
    {
	let correct = !formula.value === this.notty
	formula.questionState = correct ? Formula.correct : Formula.incorrect
	return correct
    }
}

class Score extends THREE.Mesh
{
    constructor (font)
    {
	super ()
	this.font = font
	this.score = 0
	this.displayedScore = this.score
	this.material = new THREE.MeshStandardMaterial({color:0xcccccc})
	this.update()

	this.position.set(0,1,6)
    }
    
    update ()
    {	    
	var geometry = new THREE.TextGeometry(this.score, {font: this.font,
    							   size:1, height:0.1,
							   curveSegments: 4,
    							   bevelEnabled:true,
    							   bevelThickness:0.2,
    							   bevelSize: 0.05})
	geometry.center()
	this.geometry.fromGeometry(geometry)
	return this
    }
    
    increment ()
    {
	this.score++
	this.update()
    }
}

class GameDirectionalLight extends THREE.DirectionalLight
{
    constructor ()
    {
	super(0xffffff, 1.0)
	this.castShadow = true
	this.shadow.mapSize.width = 512
	this.shadow.mapSize.height = 512
	let d = 12
	this.shadow.camera.left = -d
	this.shadow.camera.right = d
	this.shadow.camera.top = d
	this.shadow.camera.bottom = -d
	this.shadow.camera.far = 100
	this.position.set( -3, 4, 5 )
    }
}

class Ground extends THREE.Mesh
{
    constructor ()
    {
	let segments = 20
	let plane = new THREE.PlaneBufferGeometry(300,200,segments,segments)
	let verts = plane.attributes.position.array
	for (let i=2; i<verts.length; i+=3)
	    verts[i] = Math.random() * 8
	let material = new THREE.MeshStandardMaterial({color: 0x555533, side: THREE.DoubleSide, shading: THREE.FlatShading})
	super(plane, material)
	this.rotateX(0.05-Math.PI/2)
	this.rotateZ(0.2)
	this.position.set(0,-5,-90)
    }
}

class Sky extends THREE.Mesh
{
    constructor ()
    {
	let vertexShader = document.getElementById( 'vertexShader' ).textContent
	let fragmentShader = document.getElementById( 'fragmentShader' ).textContent
	let uniforms = {
	    topColor:    { value: new THREE.Color( 0x0077ff ) },
	    bottomColor: { value: new THREE.Color( 0xffffff ) },
	    offset:      { value: 33 },
	    exponent:    { value: 0.8 }
	}

	let skyGeo = new THREE.SphereGeometry( 200, 32, 15 )
	let skyMat = new THREE.ShaderMaterial( { vertexShader: vertexShader, fragmentShader: fragmentShader, uniforms: uniforms, side: THREE.BackSide } )

	super( skyGeo, skyMat )
    }
}

class GameActivity
{
    constructor (game)
    {
	this.game = game
    }
    step (input) {}
    render (renderer) {}
    resize (width, height) {}
}

class LoadingActivity extends GameActivity
{
    constructor (game)
    {
	super(game)
	this.loadingManager = new THREE.LoadingManager(this.allDone.bind(this))
	this.fontLoader = new THREE.FontLoader(this.loadingManager)
	this.fontLoader.load('droid_sans_mono_regular.typeface.json', function (response) {game.assets.scoreFont = response})
	this.fontLoader.load('Black_Ops_One_Regular.json', function (response) { game.assets.formulaFont = response })
    }

    allDone ()
    {
	this.game.activity = new IntroActivity(this.game)
    }
}

class IntroActivity extends GameActivity
{
    constructor (game)
    {
    	super (game)
	this.scene = new THREE.Scene
	this.camera = new THREE.PerspectiveCamera
	this.camera.position.set(0,0,40)
	
	let spotlight = new THREE.SpotLight(0xffffff)
	spotlight.position.set(-20, 20, 20)
	this.scene.add(spotlight)
	let boolyGeometry = new THREE.TextGeometry("BOOLY", {font: this.game.assets.formulaFont,
							     size:2, height: 0.3,
							     bevelEnabled:true,
							     bevelThickness: 0.2,
							     bevelSize: 0.1})
	boolyGeometry.center()
	let boolyMaterial = new THREE.MultiMaterial([new THREE.MeshStandardMaterial({color:0x000000}),
						    new THREE.MeshStandardMaterial({color:0x339922})])
	
	let boolyMesh = new THREE.Mesh(boolyGeometry, boolyMaterial)
	boolyMesh.position.y = 2

	this.scene.add(boolyMesh)

	this.booly = boolyMesh
	
	let text = ["Press/touch for javascript falsy values",
		    "Release for javascript truthy values",
		    "Press something to begin"]
	let textGeometry = text.map(line =>
				    new THREE.TextGeometry(line, {font: this.game.assets.scoreFont,
    								  size:1, height:0.1,
								  curveSegments: 4,
    								  bevelEnabled:true,
    								  bevelThickness:0.2,
    								  bevelSize: 0.05}))
	textGeometry.forEach(geometry => geometry.center())
	let textMaterial = new THREE.MultiMaterial([new THREE.MeshStandardMaterial({color:0xfffffff}),
						    new THREE.MeshStandardMaterial({color:0x009922})])

	let textMesh = textGeometry.map(geometry => new THREE.Mesh(geometry, textMaterial))
	textMesh.forEach((mesh, n) => {
	    mesh.position.y = (n+1) * -2
	    this.scene.add(mesh)
	})
    }

    step (button)
    {
	this.booly.rotateY(0.01)
	if (button.pressTrigger)
	    this.game.activity = new PlayActivity(this.game)
    }

    render (renderer)
    {
	renderer.render(this.scene, this.camera)
    }

}

class Challenge
{
    constructor (text, speed, delay)
    {
	this.text = text
	this.speed = speed
	this.delay = delay
    }
}

class PlayActivity extends GameActivity
{
    constructor (game)
    {
	super(game)
	this.countdown = 0
	this.challenges = [
	    new Challenge('true', 0.05, 80),
	    new Challenge('false', 0.05, 80),
	    new Challenge('-1', 0.05, 60),
	][Symbol.iterator]()
	this.formulas = new Set
	this.score = new Score(this.game.assets.scoreFont)
	this.platform = new Platform
	this.ground = new Ground
	this.sky = new Sky
	this.scene = new THREE.Scene
	this.camera = new GameCamera
	this.scene.fog = new THREE.Fog( 0xcccccc, 1, 300 )
	this.hemiLight = new THREE.HemisphereLight( 0xFFFFFF, 0x555555, 0.5 )
	this.directionalLight = new GameDirectionalLight

	this.scene.add(this.hemiLight)
	this.scene.add(this.directionalLight)
	this.scene.add(this.platform)
	this.scene.add(this.ground)
	this.scene.add(this.sky)
	this.scene.add(this.score)	

	this.score.lookAt(this.camera.position)
    }
    
    step (button)
    {
	if (--this.countdown < 0) {
	    let {value: challenge, done} = this.challenges.next()
	    if (!done) {
		this.createFormula(challenge.text)
		this.countdown = challenge.delay
		this.speed = challenge.speed
	    } else {
		this.createFormula()
		this.countdown = Math.random() * 60 + 60
		this.speed += 0.0002
	    }
	}
	
	this.platform.step(button.pressed)
	this.hemiLight.groundColor.copy(this.platform.material.color)
	
	for (let formula of this.formulas) {
	    if (formula.position.y < 1 && formula.questionState === Formula.unanswered) {
		if (this.platform.answer(formula)) {
		    this.score.increment()
		    playBling(this.game.audioContext)
		} else {
		    this.game.activity = new OverActivity(this.game, this)
		    playSad(this.game.audioContext)
		}
	    }
	    if (Math.abs(formula.position.x > 15)) {
		this.formulas.delete(formula)
		this.scene.remove(formula)
	    }
	    formula.step(this.speed)
	}

    }

    createFormula (text)
    {
	let formula = new Formula(this.game.assets.formulaFont)
	if (text)
	    formula.set(text)
	else
	    formula.randomize()
	formula.position.set(Math.random()*6-3, 15, 0)
	this.formulas.add(formula)
	this.scene.add(formula)
    }

    render (renderer)
    {
	renderer.render(this.scene, this.camera)
    }

    resize (width, height)
    {
	this.camera.aspect = width / height
	this.camera.updateProjectionMatrix()
    }
}

class OverActivity extends GameActivity
{
    constructor (game, previousPlayActivity)
    {
	super(game)
	this.previousPlayActivity = previousPlayActivity
	this.scene = new THREE.Scene
	this.camera = new THREE.PerspectiveCamera
	this.camera.position.set(0,0,40)

	let gameOverGeometry = new THREE.TextGeometry("Game Over",
						      { font: game.assets.formulaFont,
    							size:2, height:0.1,
    							curveSegments: 4,
    							bevelEnabled:true,
    							bevelThickness:0.2,
    							bevelSize: 0.05})
	gameOverGeometry.center()
	let gameOverMaterial = new THREE.MeshStandardMaterial({color:0xffffff})
	
	this.gameOver = new THREE.Mesh(gameOverGeometry, gameOverMaterial)
	this.gameOver.position.y = 4
	this.scene.add(this.gameOver)
    }
    
    step (button)
    {
	if (button.pressTrigger) {
	    console.log(button)
	    this.game.activity = new PlayActivity(this.game)
	}
    }
    
    render (renderer)
    {
	this.previousPlayActivity.render(renderer)
	renderer.clearDepth()
	renderer.render(this.scene, this.camera)
    }
}

class TheButton
{
    constructor ()
    {
	this._pressed = false
	this._trigger = false
	window.addEventListener('keydown', this.processEvent.bind(this))
	window.addEventListener('keyup', this.processEvent.bind(this))
	window.addEventListener('mousedown', this.processEvent.bind(this))
	window.addEventListener('mouseup', this.processEvent.bind(this))
	window.addEventListener('touchstart', this.processEvent.bind(this))
	window.addEventListener('touchend', this.processEvent.bind(this))
    }
    
    processEvent (event)
    {
	let pressed =
	    event.type === 'keydown' ||
	    event.type === 'mousedown' ||
	    event.type === 'touchstart'
	this._trigger = pressed !== this._pressed
	this._pressed = pressed
    }

    resetTrigger ()
    {
	this._trigger = false
    }

    get pressed () { return this._pressed  }
    get released () { return !this._pressed  }
    get trigger () { return this._trigger }
    get pressTrigger () { return this._pressed && this._trigger }
    get releaseTrigger () { return !this._pressed && this._trigger }
}

class GameRenderer extends THREE.WebGLRenderer
{
    constructor ()
    {
	super({antialias: true})
	this.shadowMap.enabled = true
	this.shadowMap.type = THREE.PCFSoftShadowMap 
	this.gammaInput = true
	this.gammaOutput = true
	this.setSize(window.innerWidth, window.innerHeight)
	this.setPixelRatio(1)
	this.setClearColor(0xffffff)
	this.autoClear = false
	document.body.appendChild(this.domElement)
    }
}

class GameCamera extends THREE.PerspectiveCamera
{
    constructor ()
    {
	super (50, window.innerWidth/window.innerHeight, 0.1, 250)
	this.position.set(0,10,23)
	this.lookAt(new THREE.Vector3(0,5,0))
	this.step = this.playBehavior
    }

    step ()
    {
	this.behavior
    }
}

class Game
{
    constructor () {
	this.assets = {}
	this.audioContext = new AudioContext
	this.button = new TheButton
	this.renderer = new GameRenderer
	this.activity = new LoadingActivity(this)
	
	window.addEventListener('resize', this.onWindowResize.bind(this), false)
	setInterval(this.step.bind(this), 1/60 * 1000)
	this.animate()
    }

    step ()
    {
	this.activity.step(this.button)
	this.button.resetTrigger()
    }
    
    animate ()
    {
	requestAnimationFrame(this.animate.bind(this))
	this.activity.render(this.renderer)
    }

    onWindowResize ()
    {
	let width = window.innerWidth
	let height = window.innerHeight
	this.activity.resize(width, height)
	this.renderer.setSize(width, height)
    }
}

let game = new Game

