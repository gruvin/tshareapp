import React from 'react'
import { 
    Container,
    Button,
    Row, Col,
    Image,
} from 'react-bootstrap'
import './ConfirmPrize.scss'

import imgHeart from './assets/fluffy-heart_128x128.png'

import { gsap } from "gsap"
import { RoughEase } from "gsap/EasePack";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
gsap.registerPlugin(MotionPathPlugin, RoughEase);

// eslint-disable-next-line
const debug = require('debug')('Confirm')

class ConfirmPrize extends React.Component {
    constructor(props) {
        super(props)
        this.web3 = null;
        this.parent = this.props.parent
        this.state = {
            prize: Number(localStorage.getItem('prize') || "2") 
        }
        this.prizeNodes = []
    }

    async componentDidMount() {
        if (localStorage && localStorage.getItem("debug")) window._C = this
        const heartEl = this.prizeNodes[this.state.prize - 1].childNodes[0]
        const yearEl = this.prizeNodes[this.state.prize - 1].childNodes[1]
        gsap.timeline()
            .set(".App", { overflowY: "hidden" })
            .set(heartEl, { filter: `saturate(1) brightness(1)`, zIndex: 9999 })
            .set(yearEl, { filter: `saturate(1) brightness(1)` })
            .to("#confirm-prize",{ duration: 0.3, opacity: 1 })
            .from(heartEl, {
                duration: 1,
                transform: `scale(80) translate(0, ${this.prizeBox.offsetHeight*0.5}px)`,
                ease: 'power4.out'
            }, "<")
            .set("#prizes > div > div > span", { visibility: "visible" })
            .set(".App", { overflowY: "auto" })
    }

    render() {
        return (<>
        <Container id="confirm-prize" className="p-3 text-light">
            <h1>You WON a fluffy heart!</h1>
            <Row className="mr-3 p-3">
                <Col xs={4} id="prize-labels">
                    <div>POINTS</div>
                    <div>per. $50</div>                                        
                    <div>YEARS</div>
                </Col>
                <Col xs={8} id="prizes" ref={r => this.prizeBox = r}>
                    <div ref={r => this.prizeNodes[0] = r}>
                        <div>
                            <Image id="s2-1" className="step2-heart" src={imgHeart} />
                            <span>35</span>
                        </div>
                        <div>5</div>
                    </div>
                    <div ref={r => this.prizeNodes[1] = r}>
                        <div>
                            <Image className="step2-heart" src={imgHeart} />
                            <span>100</span>
                        </div>
                        <div>10</div>
                    </div>
                    <div ref={r => this.prizeNodes[2] = r}>
                        <div>
                            <Image className="step2-heart" src={imgHeart} />
                            <span>150</span>
                        </div>
                        <div>15</div>
                    </div>
                </Col>
            </Row>
            <Row className="p-3">
                <Col>
                    <Button
                        className="button-pink"
                        block
                        onClick={e => this.parent.setStep(3)}
                    >KEEP PRIZE</Button>
                </Col>
            </Row>
            <Row className="p-3">
                <Col>
                    <Button 
                        className="button-grey"
                        block
                        onClick={e => this.parent.setStep(1)}
                    >TRY AGAIN</Button>
                </Col>
            </Row>
        </Container>
    </>)
    }
}

export default ConfirmPrize;