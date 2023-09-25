import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "../styles/Home.module.css";
import { useContract, useContractRead, useContractWrite, useAddress, ConnectWallet, useSDK, ThirdwebProvider } from "@thirdweb-dev/react";
import { useQuery, gql, useLazyQuery } from '@apollo/client';
import GetProposalInfo from "../components/GetProposalInfo";
import snapshot from '@snapshot-labs/snapshot.js'
import moment from "moment";
import Modal from "../components/Modal";
import { IoExitOutline, IoCheckmarkOutline, IoCheckmarkCircleOutline, IoArrowBackOutline } from "react-icons/io5"
import Loading from "../components/Loading";

interface Proposal {
  id: number,
  title: string,
  body: string,
  choices: string[],
  start: number,
  end: number,
  snapshot: string,
  state: string,
  scores: number[],
  scores_by_strategy: number[][],
  scores_total: number,
  scores_updated: number,
  author: string,
  space: {
    id: string,
    name: string,
  }
}

const CONTRACT_ADDRESS = "0xC432013CbA34F5202c3cAf109d3456d3b97e11bB";

const GET_SPACES = gql`
  query {
    space(id: "jonomnom.eth") {
      id
      name
      about
      network
      symbol
      members
    }
  }
`
const GET_PROPOSALS = gql`
  query Proposals {
    proposals (
      first: 3,
      skip: 0,
      where: {
        space_in: ["jonomnom.eth"],
      },
      orderBy: "created",
      orderDirection: desc
    ) {
      id
      title
      body
      choices
      start
      end
      snapshot
      state
      scores
      scores_by_strategy
      scores_total
      scores_updated
      author
      space {
        id
        name
      }
    }
  }
`


export default function Home() {
  const hub = 'https://hub.snapshot.org'; // or https://testnet.snapshot.org for testnet
  const client = new snapshot.Client712(hub);
  const router = useRouter();
  const address = useAddress()
  const sdk = useSDK()
  const web3 = sdk?.getSigner()?.provider

  const proposalsQuery = useQuery(GET_PROPOSALS)
  const [votes, setVotes] = useState<number[]>([])
  const [votingPower, setVotingPower] = useState<number[]>([])
  const [voteSuccess, setVoteSuccess] = useState<boolean>(false)
  const [modalIndex, setModalIndex] = useState<number>(0)

  const [isOpen, setIsOpen] = useState<boolean>(false)

  // console.log(votes)
  // console.log(address)
  // console.log(isOpen)
  // console.log(votingPower)
  // console.log("PROPOSAL QUERY", proposalsQuery.data)
  

  //formats numbers 
  const nFormatter = (num: number, digits: number) => {
    const lookup = [
      { value: 1, symbol: "" },
      { value: 1e3, symbol: "k" },
      { value: 1e6, symbol: "M" },
      { value: 1e9, symbol: "B" },
      { value: 1e12, symbol: "T" },
      { value: 1e15, symbol: "P" },
      { value: 1e18, symbol: "E" }
    ];
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    var item = lookup.slice().reverse().find(function(item) {
      return num >= item.value;
    });
    return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
  }

  const handleVote = async (proposalIndex: number, choiceIndex: number) => {
    const proposalID = proposalsQuery?.data.proposals[proposalIndex].id
    setIsOpen(true)
    setModalIndex(2)

    try {
      if (web3) {
        await client.vote(web3, address?address:"", {
          space: 'jonomnom.eth',
          proposal: proposalID,
          type: 'single-choice',
          choice: choiceIndex + 1,
          reason: '',
          app: 'snapshot'
        })
        setModalIndex(0)
        setVoteSuccess(true)
      }
    } catch (e) {
      console.log(e)
      setModalIndex(1)
    }
      
      
  }

  useEffect(() => {
    if (voteSuccess) {
      proposalsQuery.refetch()
      setVoteSuccess(false)
    }
  }, [voteSuccess])

  return (
    <div style={{width: '100%', padding: '4% 8%', textAlign: 'left', color: 'white', position: 'relative'}}>
      <Modal isOpen={isOpen} setIsOpen={setIsOpen}>
        {modalIndex == 0 &&
          <>
            <h3>Your Vote is In!</h3>
            <button
              onClick={() => {setIsOpen(false)}}
              style={{width: '100%', backgroundColor: "rgba(255,255,255,0)", color: 'white', border: '1px solid rgba(255,255,255,0.5)'}}  
            >
              Close
            </button>
          </>
        }
        {modalIndex == 1 &&
          <>
            <h3 style={{marginTop: 5}}>Failed to vote</h3>
            <button
              onClick={() => {setIsOpen(false)}}
              style={{width: '100%', backgroundColor: "rgba(255,255,255,0)", color: 'white', border: '1px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: "10px"}}  
            >
              Close
            </button>
          </>
        }
        {modalIndex == 2 &&
          <Loading/>
        }
      </Modal>
      {!address ? <ConnectWallet/>:
        <>
          <button onClick={router.back} style={{backgroundColor: 'rgba(255,255,255,0.1)', padding: "10px", borderRadius: "100px", height: 'fit-content', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <IoArrowBackOutline size={25} color="white"/>
          </button>
          <h1 style={{  wordWrap: "break-word"}}>Proposals</h1>
          <div style={{display: 'flex', flexDirection: 'column', width: '100%', gap: '20px', marginTop: "50px"}}>
            {proposalsQuery?.data?.proposals?.map((proposal: Proposal, proposalIndex: number) => {
              return (
                <div key={proposalIndex} className={styles.proposalContainer}>
                  
                  {/* dont ask me why this components isnt returning any jsx if it works it works :) */}
                  <GetProposalInfo voteSuccess={voteSuccess} setVotes={setVotes} votingPower={votingPower} setVotingPower={setVotingPower} address={address} proposalID={proposalsQuery?.data?.proposals[proposalIndex].id} index={proposalIndex}/>
                  
                  {/* Left Column */}
                  <div key={proposalIndex} style={{flexWrap: 'wrap', gap: "30px", display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1}}>
                    <div style={{lineHeight: "30px"}}>
                      <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: "10px", flexWrap: 'wrap'}}>

                        <div>
                          {/* Proposal Title */}
                          <h3 style={{margin: "0px"}}>{proposal.title}</h3>
                          {/* Author */}
                          <p style={{margin: "5px 0px 15px 0px", color: '#BBB', fontSize: '14px'}}> 
                            Created by {proposal.author.substring(0, 5) + '...' + address.substring(address.length - 5, address.length - 1)}
                          </p>
                        </div>

                        {/* Proposal State */}
                        <div style={{marginBottom: "20px", height: 'fit-content', backgroundColor: proposal.state == "active"?'rgba(102,190,101, 1)':'rgba(235,102,101, 1)', color: 'white', fontSize: "12px", fontWeight: 'bold', padding: "5px 15px", borderRadius: "10px"}}>
                          <p style={{margin: "0px"}}>
                            {proposal.state.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      <p>{proposal.body} </p>
                    </div>

                    {/* Choices */}
                    <div style={{display: 'flex', flexDirection: 'column', flexGrow: 1, gap: "15px"}}>
                      {proposal.choices.map((choice, choiceIndex) => {
                        return (
                          <button 
                            key={choiceIndex} 
                            onClick={() => {handleVote(proposalIndex, choiceIndex)}}
                            // onMouseEnter={() => {

                            // }}
                            // onMouseLeave={() => {

                            // }}
                            // style={{backgroundColor: (proposalSelected == proposalIndex && choiceSelected == choiceIndex)?"rgba(255,255,255,0.2)":"rgba(255,255,255,0)"}}
                            className={styles.proposalButton}
                            style={votes[proposalIndex] == choiceIndex + 1 ? {backgroundColor: "rgba(255,255,255,0.2)"}:{}}
                          >
                            {choiceIndex + 1 == votes[proposalIndex] && <IoCheckmarkOutline size={18}/>}
                            <p style={{margin: 0, marginRight: 'auto'}}>
                              {choice}
                            </p>
                            <div>
                              {nFormatter(proposal.scores[choiceIndex], 1)} votes
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  
                  {/* Right Column */}
                  <div style={{whiteSpace: 'nowrap', backgroundColor: 'rgba(255,255,255,0.05)', padding: '30px 3%', borderRadius: "20px", display: 'flex', justifyContent: 'space-between', gap: "20px", fontSize: "14px", width: '100%', maxWidth: "330px"}}>
                    <div style={{color: '#BBB', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap'}}>
                      <p>Start Date </p>
                      <p>End Date </p>
                      <p>Snapshot </p>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '20px'}}>
                      <p>{moment(proposal.start * 1000).format("lll")}</p>
                      <p>{moment(proposal.end * 1000).format("lll")}</p>
                      <a 
                        style={{display: 'flex', alignItems: 'center', gap: "10px", color: 'white', textDecoration: 'none'}} 
                        href={`https://etherscan.io/block/`+ proposal.snapshot} target="_blank" rel="noreferrer"
                      >
                        <p style={{margin: 0}}>{proposal.snapshot}</p>
                        <IoExitOutline/>
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      }
    </div>
  );
}
