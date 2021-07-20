import React from 'react'
import { 
    Container,
    // Row, Col,
    // DropdownButton,
    Button,
    Card,
    Image,
    Badge,
} from 'react-bootstrap'
import './MintPrize.scss'
import HEX from './hex_contract'
import BN from 'bignumber.js'
import Dialog from 'react-bootstrap-dialog'
import axios from 'axios'
import imgBanner from './assets/achievements-trial.png'
import imgBackArrow from './assets/mm-back-arrow.png'
import imgMmBuyAni from './assets/mm-buy-ani.gif'
import imgWait from './assets/wait-blocks.gif'
// import imgWyreKYC from './assets/wyre-kyc-msg.png'
// import imgBuyEth from './assets/buy-eth.png'
// import imgSwapEth from './assets/swap-eth-hex-96.png'

axios.defaults.timeout = 1000

const { format } = require('d3-format')

// eslint-disable-next-line
const debug = require('debug')('Mint')

const uriQuery = new window.URLSearchParams(window.location.search)

class MintPrize extends React.Component {
    constructor(props) {
        super(props)
        this.web3 = null;
        this.parent = this.props.parent
        this.HEX = this.props.parent.HEX
        this.state = {
            hexIsRegistered: true,
            gasEstimate: 0, // gas
            gasPrice: BN(0), // ETH
            gasCostWei: BN(0),
            dataReady: false,
            stakeHearts: this.parent.state.hearts.div(1E08).gt(500) ? BN(500).times(1E08) : this.parent.state.hearts,
            years: [5, 10, 15][Number(localStorage.getItem('prize') || "2")-1],
            msg: "",
            msgDetail: "",
            msgVariant: "info",
            txhash: "",
            stakeConfirmed: false,
        }
    }

    registerHexAsset() {
        window.ethereum
        .request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
                options: {
                    address: HEX.CHAINS[this.parent.state.chainId].address,
                    // Leaving these out should cause silently fail, if HEX is already registered
                    symbol: 'HEX',
                    decimals: 8,
                },
            },
        })
        .then((success) => {
            if (success) {
                debug('HEX successfully added to wallet!')
                this.setState({ hexIsRegistered: true })
            } else {
                throw new Error('Something went wrong trying to add HEX asset to MetaMask.')
            }
        })
        .catch(err => {
            debug(err)
            this.setState({ hexIsRegistered: false })
        })
    }
    
    estimateGasCost() {
        // debug(`contractReady:${this.parent.state.contractReady} account:${this.parent.state.account}`)
        return new Promise((resolve, reject) => {
            // stakeStart gas price is always 96595 (can't use .estimateGas with an empty account)
            const gasEstimate = 96595
            const apiUrl = "https://ethgasstation.info/api/ethgasAPI.json?api-key=6819e1c252759868d79d120a85e33f22536f65cb63123c03faa548fa192b"
            axios.get(apiUrl, { timeout: 3000 /*ms*/} )
            .then(response => {
                const data = response.data
                // debug("ethgasstation:: response: %o", data)
                const gasPriceGwei = BN(data.fastest).div(10)
                debug(`ethgasstation.info:: gas price (fastest): ${gasPriceGwei.toFixed(0)} Gwei`)
                const gasPrice = gasPriceGwei.times(1E09) // wei
                const gasCostWei = gasPrice.times(gasEstimate) // wei
                return resolve({
                    gasEstimate,
                    gasPrice,
                    gasCostWei
                })
            })
            .catch(err => { // Fail averagelyish? Hope and pray? Bring on PulseChain!
                debug("ethgasstation:: error: ", err.code, err.message)
                return reject(err.message)
            })
        })
    }

    async componentDidMount() {
        if (localStorage && localStorage.getItem("debug")) window._M = this
        
        // this.registerHexAsset()
        // this.parent.updateEth()
        // const gasEstimate = await this.estimateGasCost()
        this.setState({
            // ...gasEstimate,
            dataReady: true,
        })
    }

    mintPrize = async () => {
        const msgVariant = "info"
        const msg = <h2>Transaction Authorization</h2>
        const msgDetail = <p>Requesting HEX stakeStart transaction broadcast from MetaMask wallet.</p>
        this.setState({ msg, msgDetail, msgVariant })

        const { HEX } = this.parent
        const { account, hearts } = this.parent.state
        const years = this.state.years
        const days = Math.floor(years * 365)

        debug(`MINTING PRIZE! aka HEX.stakeStart(hearts:${hearts}, years:${years})`)

        try {
            HEX.methods.stakeStart("0x"+this.state.stakeHearts.toString(16), days).send({from: account })
            .on('transactionHash', txHash => {
                // append txHash to localStorage txHashArray
                const storedTxHashes = JSON.parse(localStorage.getItem('txHashArray')) || []
                localStorage.setItem('txHashArray', JSON.stringify([ ...storedTxHashes, txHash]))          
                const msgVariant = "info"
                const msg = <h2>Success!</h2>
                const msgDetail = <div>
                    <p>Your HEX Stake Start transaction has been broadcast to the blockchain network.</p>
                    <p><Image src={imgWait} style={{ width: "1.4em", marginRight: "0.5em" }}/> <b>Awaiting confirmation ...</b></p>
                </div>
                this.setState({ msg, msgDetail, msgVariant })    
            })
            .on('confirmation', (confirmationNumber, receipt) => {
                const msgVariant = "success"
                const msg = <div className="text-center"><h2>Confirmed! You're a Hexican!</h2><h4>...and a member of the StakerClass™</h4></div>
                const msgDetail = <>
                    <Container className="text-center">
                    <h3 className="mt-3">Manage all your stakes at ...</h3>
                    <Button
                        variant="outline-primary"
                        href="https://go.tshare.app/"
                    >
                        <h1 className="m-0 mb-1 text-light">go.TShare.app</h1>
                    </Button><br/>
                    <Badge className="text-muted text-uppercase text-bold small">
                        <p className="m-0">the full experience</p>
                    </Badge>
                </Container>
                </>
                this.setState({ msg, msgDetail, msgVariant, stakeConfirmed: true })
            })
            .on('receipt', receipt => {
                debug("TX RECEIPT: ", receipt)
            })
            .on('error', (err, receipt) => { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
                const msgVariant = "danger"
                const msg = <h2>There could be a problem ...</h2>
                const msgDetail = <p>{err.message}</p>
                this.setState({ msg, msgDetail, msgVariant })
            })

        } catch(err) {
            const msgVariant = "danger"
            const msg = <h2>FAULT</h2>
            const msgDetail = <p>{err.message}</p>
            this.setState({ msg, msgDetail, msgVariant })
        };
    }

    render() {
        if (!this.state.dataReady) return (
            <Container className="p-3 text-light text-center">
                <h2 className="mb-3 text-center">CONGRATULATIONS!</h2>
                <p>loading data ...</p>
            </Container>
        )
        const { wei, hearts } = this.parent.state
        const { gasCostWei, stakeHearts } = this.state
        const decimals = hearts.idiv(1E08) > 999 ? 0 : 4
        const stakeAmount = format(`,.${decimals}f`)(stakeHearts.div(1E08).toNumber())

        const ethAvailable = wei.div(1E18).toNumber().toPrecision(3)
        const gasRequired = (gasCostWei.gt(0)) ? gasCostWei.div(1E18).times(1.2).toNumber().toPrecision(3) : "0.002"
        const ethPriceUsd = 1900
        const ethToBuyUsd = 50

        // const wyreUrl = `https://pay.sendwyre.com/purchase?dest=ethereum:${this.parent.state.account}&destCurrency=ETH&amount=50&accountId=AC-7AG3W4XH4N2&paymentMethod=debit-card`
        
        // const hexAssetRegistered = this.state.hexIsRegistered 
        // ?<>
        //     <ol><li>HEX added to MetaMask</li></ol>
        // </>:<>
        //     <Button>Add HEX to MetaMask</Button>
        // </>

        const enoughEthToBuyHex = BN(hearts).eq(0) && BN(wei).div(1E18).gt(ethToBuyUsd/ethPriceUsd)
        ?<>
            <li className="ethereum"><span className="text-white">Acquired ETH</span>. Cool!</li>
        </>:<>
            <li className="eth-empty">
                <p><span className="text-white">Buy some ETH</span><span className="small"> to exchange for HEX</span> ... </p>
                <Image src={imgMmBuyAni} width="100%" />
                <p className="mt-2 text-danger text-center small">Didn't work? Try a different card?</p>
            </li>
        </>

        const enoughHexToStake = BN(hearts).gt(1E08) // 1 HEX
        ?<>
            <li className="hex"><span className="text-white">Acquired HEX</span>. Awesome!</li>
        </>:<>
            <li className="hex-empty">
                <p><span className="text-white">Enough HEX</span> to Mint your Prize?</p>
                <Button variant="info" className="bg-info-faded text-light"
                    onClick={() => {
                        this.dialog.show({
                            title: <>
                                <h2 className="text-center">going to <b>ethhex.com</b><br/>
                                Decentralized Exchage<br/>with <b>no counterparty risk</b></h2>
                            </>,
                            body: <>
                                {(/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(navigator.userAgent)) ? <>
                                    <p><strong>Use MetaMask's browser <span className="text-info">BACK&nbsp;ARROW</span> to return here.</strong></p>
                                    <Badge variant="warning">LOOK LOWER LEFT</Badge>
                                    <Image src={imgBackArrow} width="90%" />
                                </>:<>
                                    <p><strong>Use <span className="text-info">BACK</span> button to return here</strong>.</p>
                                </>}
                            </>,
                            actions: [
                                Dialog.CancelAction(),
                                Dialog.OKAction(() => { 
                                    document.location.href = "https://ethhex.com"
                                })
                            ],
                        })
                    }}
                >Swap some ETH for HEX</Button>
                <p className="mt-2">
                    <Badge variant="danger">HEADS UP!</Badge><br/>
                    <span className="text-warning small"> Leave at least {gasRequired} ETH for fees</span>
                </p>
            </li>
        </>

        const enoughEthForFee = gasCostWei.lt(wei)
        ?<>
            <li className="ethereum"><span className="text-white">Retained 'gas' fee</span>. Clever!</li>
        </>:<>
            <li className="eth-empty">
                <p><span className="text-white">Enough ETH</span> for gas fees?</p>
                <p>
                    We have <span className="text-info"> {ethAvailable}&nbsp;ETH</span> but we
                    need <span className="text-warning"><strong>{gasRequired}</strong>&nbsp;ETH</span>
                </p>
                <Button>Buy some ETH</Button>
            </li>
        </>

        const storedTxHashes = JSON.parse(localStorage.getItem('txHashArray')) || []

        return (<>
        <Container className="mint-prize p-3 text-light">
            <Card className="mx-3 bg-black text-light">
                <Card.Header className="m-0 p-0 text-center">
                    <Image className="mt-1" src={imgBanner} alt="ACHIEVEMENTS" />
                </Card.Header>
                <Card.Body className="py-0">
                    <ol>
                        {/* {hexAssetRegistered} */}
                        <li className="heart"><span className="text-white">Won a fluffy heart!</span> Fun!<br/></li>
                        {BN(hearts).eq(0) && enoughEthToBuyHex}
                        {BN(wei).gt(0) && enoughHexToStake}
                        {!BN(hearts).eq(0) && enoughEthForFee}
                    </ol>
                </Card.Body>
            </Card>
            <Container className="p-3">
                    <Button className="button-pink" block
                        onClick={this.mintPrize}
                    >
                        <h1 className="m-0">MINT PRIZE</h1>
                        <h2 style={{ margin: 0, lineHeight: "1.4em" }}>
                            Stake <tt style={{ fontSize: "1.6em"}}>{stakeAmount}</tt> HEX<br/>
                            for <tt style={{ fontSize: "1.2em"}}>{this.state.years}</tt> YEARS
                        </h2>
                    </Button>
                {this.state.msg === "" 
                ? <Container className="mt-3 p-3 text-light bg-dark">
                        Minting your prize <em><b>creates a HEX stake </b></em>
                        for the duration won, with <em>existing HEX from your wallet</em>.
                </Container>
                : <Container className={`mt-3 p-3 text-light bg-${this.state.msgVariant}-darkened`}>
                    {this.state.msg}
                    {this.state.msgDetail}
                </Container>}
            </Container>
            <Container className="p-3">
                <h3 className="my-3 text-center">... or ...</h3>
                <Button
                    className="button-grey"
                    block
                    onClick={e => this.props.parent.setStep(1)}
                >START OVER</Button>
            </Container>
            { uriQuery.has('debug') && storedTxHashes.length > 0 && 
                <Container className="p-3 text-center">
                    <h3>Previous Stake Ttransactions</h3>
                    { storedTxHashes.map(txHash => (
                        <Button
                            className="my-1 text-monospace"
                            onClick = {() => window.location.href=`https://etherscan.io/tx/${txHash}`}
                            key={txHash}
                        >
                            <span className="small">
                                {txHash.substr(0, 12) + "..." + txHash.substr(-12)}
                            </span>
                        </Button>
                    ))}
                    <Badge variant="" className="text-muted">
                        txn hashes locally recorded in this app
                    </Badge>
                </Container>
            }
        </Container>
        <Container className="text-center">
            <Badge className="text-muted text-uppercase text-bold small">
                <p className="my-0">pay your future self!</p>
            </Badge><br/>
            <Button
                variant="primary"
                href="https://go.tshare.app/"
            >
                <h1 className="m-0 mb-1 text-light">go.TShare.app</h1>
            </Button><br/>
            <Badge className="text-muted text-uppercase text-bold small">
                <p className="m-0">the full experience</p>
            </Badge>
        </Container>
        <Dialog ref={r => this.dialog = r} />
    </>)
    }
}

export default MintPrize;