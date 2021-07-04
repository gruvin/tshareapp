import React from 'react'
import { 
    Container,
    Button,
} from 'react-bootstrap'

import { Player, BigPlayButton } from 'video-react';

class Slots extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            playSlots: false,
            showWinner: false,
        }
    }

    handleButtonClick = () => {
        this.setState({ playSlots: true })
        window.setTimeout(() => {
            this.setState({ showWinner: true })
        }, 10000)
    }

    render() {
        return (
        <Container style={{ width: 320, textAlign: "center", margin: "auto" }}>
            <div id="slots-window">
                {this.state.playSlots ? 
                    <div id="slots" style={{ position: "relative", overflow: "hidden" }}>
                        <Player
                            preLoad={true}
                            bigPlayButton={false}
                            playsInline autoPlay={true}
                            startTime={5.8}
                            poster="/assets/poster.png"
                            src="/lucky.mp4"
                            onPlay={e => document.getElementsByClassName('video-react-control-bar')[0].style.visibility = "hidden"}
                        >
                        <BigPlayButton position="center" />
                    </Player>
                        {this.state.showWinner &&
                            <div id="winner">WINNER!</div>
                        }
                    </div>
                : <Button onClick={this.handleButtonClick}>SURPRIZE ME!</Button>
                }
            </div>
            {this.state.showWinner &&
                <div id="winamount">+200</div>
            }
        </Container>
        )
    }
}

export default Slots;
