import React from 'react'
import { 
    Container,
    Image,
    Badge,
} from 'react-bootstrap'
import * as $ from 'jquery'
import imgIntroBg from './assets/intro-screen-bg.png'
import imgGameCurves from './assets/game-curves.png'
import imgIntroInsert from './assets/intro-screen-insert.png'
import imgIntroCoin from './assets/intro-coin.png'
import imgIntroCoinLit from './assets/intro-coin-lit.png'
import imgTShare from './assets/fluffy-heart_128x128.png'
import imgGameOver from './assets/game-over.png'
import imgGameOverKarim from './assets/game-over-karim.png'

import imgUp from './assets/up.png'
import imgUpLit from './assets/up-lit.png'
import imgRight from './assets/right.png'
import imgRightLit from './assets/right-lit.png'
import imgGrab from './assets/grab.png'
import imgGrabLit from './assets/grab-lit.png'
import imgCraneClaw from './assets/crane-claw.png'
import imgCraneClawClosed from './assets/crane-claw-closed.png'

import { gsap } from "gsap"
import { RoughEase } from "gsap/EasePack";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
gsap.registerPlugin(MotionPathPlugin, RoughEase);

const { format } = require('d3-format')

// eslint-disable-next-line
const debug = require('debug')('Game')
const uriQuery = new URLSearchParams(window.location.search)

function createEnum(values) {
    const enumObject = {};
    for (const val of values) {
        enumObject[val] = val;
    }
    return Object.freeze(enumObject);
}
  
const STATES = createEnum([
    'INIT',
    'WAITCOIN',
    'INSERTCOIN',
    'START',
    'PLAY',
    'CRANEDROP',
    'CRANEBOTTOM',
    'CRANETOP',
    'WON',
    'TIMEUP',
    'GAMEOVER'  
])
// const INTRO_STATES = [STATES.INIT, STATES.WAITCOIN, STATES.INSERTCOIN, STATES.START]

class CraneGame extends React.Component {

    constructor(props) {
        super(props)

        HTMLCollection.prototype.forEach = Array.prototype.forEach
        window.oncontextmenu = function() { return false; }
        window.jQuery = window.$ = $
        this.parent = this.props.parent
        this.state = {
            buttonUpPressed: false,
            buttonRightPressed: false,
            targetAcquired: false,
            crane: { x: 0, y: 0, height: 0.8, closed: false },
            gameSeconds: 15,
            phase: STATES.INIT,
        }
        this.timeWhenLastUpdate = 0
        this.frameCounter = 0
    }

    componentDidMount() {
        if (localStorage && localStorage.getItem("debug"))  window._G = this
        document.addEventListener('long-press', e => null )

        document.getElementById('game-elements').style.display = "block"
        document.getElementById('game-over').style.display = "none"

        this.boxWidth = $(this.gameBox).width()
        this.boxHeight = this.boxWidth * 0.8 // aspect ratio of game box images
        this.gridSizeFactor = 0.9

        // crane x/y starts at [0, 0] (#game-box lower left corner)
        this.craneOffsetX = 15 * this.boxWidth / 100
        this.craneOffsetY = this.boxHeight - 18 * this.boxHeight / 100

        const setPos = (el) => {
            el.style.position = "absolute"
            el.style.left = (el.offsetWidth || 128) / -2 + "px"  // tx referenced from center width
            el.style.top  = (el.offsetHeight || 128) / -2 + "px" // ty referenced from center heihgt
            const x = Math.floor(parseFloat(el.dataset.x/* % */) * this.boxWidth * this.gridSizeFactor / 100)
            const y = Math.floor(parseFloat(el.dataset.y/* % */) * this.boxHeight * this.gridSizeFactor / 100)
            const scale = el.dataset.scale
            el.style.transform = `translate(${x}px, ${y}px) scale(${scale})`

            el.cx = x
            el.cy = y
            el.scale = scale
            // debug(`id:${el.id}, cx:${el.cx}, cy:${el.cy}, w:${el.width}, h:${el.height}`)
        }
        this.imgTShare1.onload = e => setPos(e.target)
        this.imgTShare2.onload = e => setPos(e.target)
        this.imgTShare3.onload = e => setPos(e.target)
        setPos(this.introCoin)
        setPos(this.craneClaw)

        this.phase = STATES.INIT
        requestAnimationFrame(this.gameLoop)
    }

    componentWillUnmount() {
        // window.clearInterval(this.gameLoopTimer)
    }

    craneTarget() {
        const onTarget = (t) => {
            const ax = this.state.crane.x + this.craneOffsetX - 8
            const ay = this.state.crane.y + this.craneOffsetY - 14 + 31
            // debug (t.id,"A:", ax, ay)

            const bx = t.cx
            const by = t.cy
            // debug (t.id,"B:", bx, by)
    
            const d = 12 // delta accuracy +/- (pixels)
    
            const hitX = ((ax-bx-d)^(ax-bx+d)) < 0
            const hitY = ((ay-by-d)^(ay-by+d)) < 0

            return (hitX && hitY )
        }
        const elements = [ this.imgTShare1, this.imgTShare2, this.imgTShare3 ] // , this.imgTShare4 ]
        let found = null
        elements.forEach(el => { 
            if (onTarget(el)) {
                found = el 
                el.classList.add("on-target")
            } else {
                el.classList.remove("on-target")
            }
        })
        this.setState({ targetAcquired: found })
        return found
    }

    gameLoop = (time) => {
        const timePerFrame = 1000 / 15 // 15fps
        const timeFromLastUpdate = time - this.timeWhenLastUpdate

        if (timeFromLastUpdate > timePerFrame) {
            this.timeWhenLastUpdate = time
            this.frameCounter++

            let { x, y, height: craneHeight } = this.state.crane
            let { gameSeconds } = this.state

            switch (this.state.phase) {
                case STATES.INIT:
                    this.setState({ phase: STATES.WAITCOIN })
                    break

                case STATES.WAITCOIN:
                    break

                case STATES.INSERTCOIN:
                    document.getElementById("intro-insert").style.display = "none"
                    document.getElementById("intro-coin-lit").style.display = "none"
                    
                    this.setState({ phase: null })

                    const elements = [this.introCoin, this.craneClaw ]
                    gsap.timeline()
                        .to(elements,   { duration: 0.4,                y: '180%',  rotation: 180,  ease: "power1.in" })
                        .to(elements,   { duration: 0.2, x: '100%',     y: '150%',  rotation: 360,  ease: 'none' })
                        .to(elements,   { duration: 0.4, x: '161.5%',   y: '140%',  rotation: 720,  ease: 'none' })
                        .to(elements,   { duration: 0.6,                y: '270%',                  ease: 'power1.out' })
                        .then(() => { this.setState({ phase: STATES.START }) })
                    break

                case STATES.START:
                    this.setState({phase: null}) // revents reentrance as aninmations run

                    gsap.to('.intro-element', { duration: 0.5, opacity: 0.0 } )
                    gsap.to('.game-element',  { duration: 0.5, opacity: 1.0 } )                 
                    gsap.timeline()
                        .delay(0.5)
                        .add("1")
                        .set(this.craneClaw, { rotate: 0 })
                        .to(this.craneClaw, { duration: 1, x: '+=5%',      y: '-=50%',  scale: 1.2,     ease: 'power4.in' })
                        .to(this.craneClaw, {
                            duration: 0.7, 
                            x: `${this.craneOffsetX}`,
                            y: `${this.craneOffsetY}`,
                            scale: craneHeight,
                            ease: 'power4.out'
                        })
                        .to([this.craneClaw, '#game-controls'], { duration: .4, filter: 'brightness(1.3)', ease: 'bounce.out' })
                        .set([this.craneClaw, '#game-controls'], { filter: 'opacity(1) saturate(1) brightness(1)' })
                        .then(e => this.setState({ phase: STATES.PLAY }) )
                        break

                case STATES.PLAY:
                    if (this.frameCounter % 15 === 0) {
                        gameSeconds--
                        if (gameSeconds < 0) {
                            this.setState({ phase: STATES.TIMEUP})
                            break
                        }
                        this.setState({ gameSeconds })
                    }
                    const oldX = x
                    const oldY = y
                    const speed = 2000
                    if (this.state.buttonRightPressed) x = Math.floor(x + speed  * this.gridSizeFactor / this.boxHeight)
                    if (this.state.buttonUpPressed) y = Math.floor(y - speed * this.gridSizeFactor / this.boxWidth)
                    if (x > 310) x = 310
                    if (y < -230) y = -230
                    if (oldX !== x || oldY !== y) {
                        // tx/ty are relative to full coin div (legacy issues)
                        const tx = x + this.craneOffsetX
                        const ty = y + this.craneOffsetY
                        gsap.to(this.craneClaw, {
                            duration: 0.25,
                            transform: `translate(${tx}px, ${ty}px) scale(${craneHeight})`,
                        })
                        this.craneTarget()
                        this.setState({ crane: { ...this.state.crane, x, y } })
                    }
                    break;

                case STATES.CRANEDROP:
                    this.setState({ phase: null }) // animation takes time
                    this.craneAttachedTo = this.craneTarget()
                    let tx, ty
                    if (this.craneAttachedTo) {
                        tx = this.craneAttachedTo.cx + 8
                        ty = this.craneAttachedTo.cy - 20
                    } else {
                        tx = x + this.craneOffsetX
                        ty = y + this.craneOffsetY
                    }
                    gsap.timeline()
                        .to([this.craneClaw, this.craneClawClosed], { 
                            duration: 1.4,
                            x: tx, y: ty,
                            scale: 0.7,
                            ease: "power1.out"
                        })
                        .then(() => this.setState({ 
                            phase: STATES.CRANEBOTTOM,
                            crane: { ...this.state.crane, closed: true },
                        }))
                     break

                case STATES.CRANEBOTTOM:
                    this.setState({ phase: null }) // animation takes time
                    if (this.craneAttachedTo) {
                        this.craneClaw.appendChild(this.craneAttachedTo)
                        this.craneAttachedTo.style.left = "-12px"
                        this.craneAttachedTo.style.top = "30px"
                        this.craneAttachedTo.style.transform = `translate(0px, 0px) scale(${this.craneAttachedTo.scale / 0.7})`
                        this.craneClaw.style.zIndex = "10000"
                        gsap.timeline()
                            .delay(1)
                            .to(this.craneClaw, {
                                duration: 1,
                                transform: `translate(${this.boxWidth*1.3}px, -150vh) scale(80)`, ease: 'power4.in'
                            })
                            .then(() => {
                                this.setState({ phase: STATES.WON })
                                // this.parent.cookies.set('prize', this.craneAttachedTo.dataset.prize, { path: '/' })
                                localStorage.setItem('prize', this.craneAttachedTo.dataset.prize, { path: '/' })
                                this.parent.setStep(2)
                            })
                    } else {
                        this.setState({ phase: null }) // animation takes time
                        const tx = x + this.craneOffsetX
                        const ty = y + this.craneOffsetY
                        gsap.timeline()
                            .delay(1)
                            .to(this.craneClaw, {
                                duration: 1.8,
                                transform: `translate(${tx}px, ${ty}px) scale(${craneHeight})`, ease: 'none'
                            })
                            .then(() => this.setState({
                                phase: STATES.PLAY,
                                crane: { ...this.state.crane, closed: false }
                            }))
                    }
                break

                case STATES.WON:
                    break

                case STATES.TIMEUP:
                    this.setState({ phase: null })
                    gsap
                        .to(this.craneClaw, { duration: 1, scale: 0, rotate: 720 })
                        .then(e => this.setState({ phase: STATES.GAMEOVER }))
                    break

                case STATES.GAMEOVER:
                    document.getElementById('game-elements').style.display = "none"
                    document.getElementById('game-over').style.display = "block"
                    break

                default:
                    break
            }            
        } // if frame time
        if (this.state.phase !== STATES.WON) requestAnimationFrame(this.gameLoop)
    }

    render() {

        const handleButtonUp = (e) => {
            e.preventDefault()
            if (this.state.phase !== STATES.PLAY) return this.setState({ buttonUpPressed: false })
            switch (e.type) {
                case "mousedown":
                case "touchstart": this.setState({ buttonUpPressed: true }); break
                default: this.setState({ buttonUpPressed: false })
            }
        }

        const handleButtonRight = (e) => {
            e.preventDefault()
            if (this.state.phase !== STATES.PLAY) return this.setState({ buttonRightPressed: false })
            switch (e.type) {
                case "mousedown":
                case "touchstart":
                    this.setState({ buttonRightPressed: true }); break
                default: this.setState({ buttonRightPressed: false })
            }
        }

        const handleButtonDrop = (e) => {
            e.preventDefault()
            if (this.state.phase !== STATES.PLAY) return this.setState({ buttonDropPressed: false })
            switch (e.type) {
                case "mousedown":
                case "touchstart":
                    this.setState({ buttonDropPressed: true, phase: STATES.CRANEDROP })
                    break
                default: {/* do nothing*/} // this.setState({ buttonDropPressed: false })
            }
        }

        switch (this.state.phase) {
            case STATES.WAITCOIN:
                this.hint = <h2>Tap the HEX Token to Start</h2>
                break
            case STATES.INSERTCOIN:
                this.hint = <h2>Get ready ...</h2>
                break
            case STATES.START:
                this.hint = <h2>... here we Go!</h2>
                break
            case STATES.PLAY:
            case STATES.CRANEDROP:
            case STATES.CRANEBOTTOM:
            case STATES.WON:               
                this.hint = <>
                    <h2>
                        Use <Image src={imgUpLit} alt="UP"/> and <Image src={imgRightLit} alt="RIGHT"/> to
                        move the <Image src={imgCraneClaw} alt="CLAW"/> claw</h2>
                    <h2>Target a fluffy red <Image src={imgTShare}/> heart</h2>
                    <h2>Drop <Image src={imgGrabLit}/> claw to claim prize!</h2>
                    <Badge variant="danger" className="text-light">TIME IS TICKING</Badge>
                </>
                break
                case STATES.TIMEUP:
                    this.hint = <h2>Oh no!</h2>
                    break

                case STATES.GAMEOVER:
                    this.hint = <h2>Tap <span className="text-success"><strong>GAME OVER</strong></span> to try again!</h2>
                    break
            default:
        }
        const hint = this.hint

        const { x, y } = this.state.crane
        // eslint-disable-next-line
        const cranePos = `[ ${x}, ${-y} ]`
        return (
            <Container id="crane-game" className="unselectable">
                <Container id="game-box" 
                    ref={r => this.gameBox = r} 
                    onClick={() => { 
                        if (this.state.phase === STATES.WAITCOIN) {
                            this.setState({ phase: STATES.INSERTCOIN })
                        }
                    }}
                >
                    <div id="intro-elements">
                        <Image id="intro-bg"            className="intro-element size-to-game-box"  src={imgIntroBg} ref={r => this.imgIntroBg = r} />
                        <div id="intro-coin" data-x="20%" data-y="88%" data-scale="1" ref={r => this.introCoin = r} >
                            <Image id="intro-coin-lit"  className="intro-element"   src={imgIntroCoinLit} />
                            <Image                      className=""                src={imgIntroCoin} />
                        </div>
                        <Image id="intro-insert"        className="intro-element size-to-game-box"  src={imgIntroInsert} />
                    </div>
 
                    <div id="game-elements">
                        <Image id="game-curves" className="game-element size-to-game-box" src={imgGameCurves} />
                        <Image id="tshare-icon-1" data-x={5*100/15+"%"}     data-y="80%" data-scale="0.45"   data-prize="1" className="game-element tshare-icon" src={imgTShare} ref={r => this.imgTShare1 = r} />
                        <Image id="tshare-icon-2" data-x={10.5*100/15+"%"}    data-y="55%" data-scale="0.6"  data-prize="2" className="game-element tshare-icon" src={imgTShare} ref={r => this.imgTShare2 = r} />
                        <Image id="tshare-icon-3" data-x={14.5*100/15+"%"}    data-y="20%" data-scale="0.7"  data-prize="3" className="game-element tshare-icon" src={imgTShare} ref={r => this.imgTShare3 = r} />

                        <Container id="down-counter" className="game-element">
                            <div>00:00</div>
                            <div>00:{format("02d")(this.state.gameSeconds)}</div>
                        </Container>
                        {/* <Container className="game-element pt-3">{cranePos}</Container> */}
                    </div>

                    <div 
                        id="crane-claw" 
                        data-x="20%" data-y="88%" data-scale="1" 
                        ref={r => this.craneClaw = r}
                    >
                        {!this.state.crane.closed 
                            ? <Image className=""   src={imgCraneClaw} />
                            : <Image className=""   src={imgCraneClawClosed} />
                        }
                    </div>

                    <div 
                        id="game-over" 
                        onClick={e => { 
                            e.preventDefault()
                            e.stopPropagation()
                            window.location.reload()
                        }}
                    >
                        {uriQuery.has("karim") && <Image id="game-over-karim" src={imgGameOverKarim} />}
                        <div><Image id="game-over-text" src={imgGameOver} /></div>
                    </div>

                </Container>

                <Container id="game-controls">
                    <Image id="btn-up" className="movement-button" src={this.state.buttonUpPressed ? imgUpLit : imgUp}     
                        onMouseDown={handleButtonUp} onTouchStart={handleButtonUp}
                        onMouseUp={handleButtonUp} onTouchEnd={handleButtonUp}
                        onMouseLeave={handleButtonUp}
                        onTouchCancel={handleButtonUp}
                    />
                    <Image id="btn-right" className="movement-button"  src={this.state.buttonRightPressed ? imgRightLit : imgRight}
                        onMouseDown={handleButtonRight} onTouchStart={handleButtonRight}
                        onMouseUp={handleButtonRight} onTouchEnd={handleButtonRight}
                        onMouseLeave={handleButtonRight}
                        onTouchCancel={handleButtonRight}
                    />
                    <Image id="btn-drop" className="movement-button"  
                        src={(this.state.buttonDropPressed || this.state.targetAcquired) ? imgGrabLit : imgGrab}
                        onMouseDown={handleButtonDrop} onTouchStart={handleButtonDrop}
                        onMouseUp={handleButtonDrop} onTouchEnd={handleButtonDrop}
                        onMouseLeave={handleButtonDrop}
                        onTouchCancel={handleButtonDrop}
                    />
                </Container>
                <Container id="hints" className="text-center">
                    {hint}
                </Container>
            </Container>)
    }
}

export default CraneGame