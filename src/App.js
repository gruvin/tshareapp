import React from 'react'
import { 
    Container,
    Button,
    Image,
    Badge,
} from 'react-bootstrap'
import ErrorBoundary from './ErrorBoundary'
import Cookies from 'universal-cookie'
import './App.scss'
import BN from 'bignumber.js'
import HEX from './hex_contract'
import CraneGame from './CraneGame'
import ConfirmPrize from './ConfirmPrize'
import MintPrize from './MintPrize'
import detectEthereumProvider from '@metamask/detect-provider'
import { OnboardingButton } from './MmOnboarding'
import Web3 from 'web3'
import imgLogo from "./assets/tshareapp-logo.png"

// eslint-disable-next-line
const debug = require('debug')('App')

const uriQuery = new URLSearchParams(window.location.search)

class App extends React.Component {
    constructor(props) {
        super(props)
        this.web3 = null;
        this.state = {
            step: 1,
            mmOnboard: true,
            chainId: 0x1,
            contractReady: false,
            account: "", // ETH address
            wei: BN(0),
            hearts: BN(0),
        }
        this.cookies = new Cookies()
    }

    updateEth = async (accounts) => {
        if (typeof accounts === 'undefined') 
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        const wei = await window.ethereum.request({ method: 'eth_getBalance', params: [accounts[0], 'latest'] })
        const hearts = await this.HEX.methods.balanceOf(accounts[0]).call()
        this.setState({
            account: accounts[0],
            wei: BN(wei),
            hearts: BN(hearts),
        })
    }

    async componentDidMount() {
        if (localStorage && localStorage.getItem("debug")) {
            window._APP = this
            window._BN = BN
        }

        const step = Number(uriQuery.get("step") || localStorage.getItem('step') || "1")
        this.setState({ step })

        // Is Metamask available?
        const provider = await detectEthereumProvider()
        if (!provider) {
            if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(navigator.userAgent))
                this.setState({ mmOnboard: "mobile" })
            else
                this.setState({ mmOnboard: "desktop" })
            return
        }
        this.setState({ mmOnboard: false })
        debug("MM detected")
        if (provider !== window.ethereum) debug("WARNING: Could be multple wallet providers!")
        const ethereum = provider

        this.web3 = new Web3(provider)
        if (this.web3.eth.hasOwnProperty('handleRevert')) this.web3.eth.handleRevert = true // ref: https://soliditydeveloper.com/web3-1-2-5-revert-reason-strings
        this.HEX = new this.web3.eth.Contract(
            HEX.ABI, 
            HEX.CHAINS[this.state.chainId].address, 
            { from: this.state.account } // default from address
        )
        if (localStorage && localStorage.getItem("debug")) window._HEX = this.HEX

        ethereum.on('accountsChanged', this.updateEth)
        ethereum.on('chainChanged', () => window.location.reload() )
        await this.updateEth()
        
        this.setState({ contractReady: true })
    }

    componentWillUnmount() {
        window.ethereum.removeAllListeners()
    }

    setStep(newStep) {
        // this.cookies.set('step', newStep, { path: '/' })
        localStorage.setItem('step', newStep)
        this.setState({ step: newStep })
    }

    render() {
        // debug("onBoard: ", this.state.mmOnboard)
        
        const ethBalance = BN(this.state.wei).div(1e18).toFixed(4)
        const hexBalance = BN(this.state.hearts).div(1e08).toFixed(4)

        const deepLinkAddr =  window.location.hostname === "tshare.app" 
            ? "tshare.app" : "tshareapp.gruvin.me" /* test site */

        // DEBUG
        return (
            <Container className="App p-0">
            {this.state.mmOnboard !== false && <>
                <Container style={{ margin: "auto" }} 
                    className="text-center text-light"
                >
                    <Image src={imgLogo} width="100%" />
                    <h1>Let's get connected!</h1>
                    <p>This dApp requires MetaMask Wallet</p>

                    {this.state.mmOnboard === "mobile" && <Container>
                        <Button onClick={e => document.location.href = `https://metamask.app.link/dapp/${deepLinkAddr}`}>
                            Open TShare.app in MetaMask
                        </Button>
                    </Container>}
                    {this.state.mmOnboard === "desktop" && <Container>
                        <OnboardingButton style={{ position: "absolute", top: 0, left: 0 }} />
                    </Container>}
                </Container>
            </>}
            {this.state.mmOnboard === false && 
                <ErrorBoundary>
                    {this.state.contractReady ? <>
                        {this.state.step === 1 && <CraneGame    parent={this} />}
                        {this.state.step === 2 && <ConfirmPrize parent={this} />}
                        {this.state.step === 3 && <MintPrize    parent={this} />}

                        {localStorage && localStorage.getItem('debug') && 
                        <Container className="mt-3 p-3 text-center">
                            <Badge variant="secondary">{this.state.account}</Badge><br/>
                            <Badge variant="primary">{ethBalance} ETH</Badge>
                            &nbsp;
                            <Badge variant="info">{hexBalance} HEX</Badge><br/>
                        </Container>}

                    </>:<Container className="text-info text-center">
                        <Image src={imgLogo} width="100%" />
                        Connecting to HEX Smart Contract
                    </Container>}
                </ErrorBoundary>}
            </Container>
        )
    }
}

export default App;