import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "../styles/Home.module.css";
import { useContract, useContractRead, useContractWrite, useAddress, ConnectWallet, useSDK, ThirdwebProvider } from "@thirdweb-dev/react";
import { useQuery, gql, useLazyQuery } from '@apollo/client';
import GetVotingPower from "../components/GetVotingPower";
import snapshot from '@snapshot-labs/snapshot.js'
import moment from "moment";



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
const GET_VOTING_POWER = gql`
  query VP($voter: String!, $proposal: String!){
    vp (
      space: "jonomnom.eth"
      voter: $voter
      proposal: $proposal
      ) {
        vp
        vp_by_strategy
        vp_state
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

  const proposalsQuery = useQuery(GET_PROPOSALS).data
  const [hasVoted, setHasVoted] = useState<boolean[]>([])
  const [votingPower, setVotingPower] = useState<number[]>([])
  const [proposalSelected, setProposalSelected] = useState<number | null>(null)
  const [choiceSelected, setChoiceSelected] = useState<number | null>(null)

  
  // console.log(web3)
  // console.log(address)
  console.log(proposalsQuery)
  // console.log(moment(proposalsQuery?.proposals[0].start * 1000).format("MMM DD, YYYY"))
  // console.log(votingPower)
  

  const handleVote = async (proposalIndex: number, choiceIndex: number) => {
    const proposalID = proposalsQuery?.proposals[proposalIndex].id
    setProposalSelected(proposalIndex)
    setChoiceSelected(choiceIndex)

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
        console.log("TESTTTT")
        //only do this if vote suceeded
        let tempChoices = [...hasVoted]
        tempChoices[proposalIndex] = true
        setHasVoted(tempChoices)
      }
    } catch (e) {
      console.log(e)
      setProposalSelected(null)
      setChoiceSelected(null)
    }
      
      
  }

  return (
    <div style={{width: '100%', padding: '5% 10%', textAlign: 'left', color: 'white'}}>
      {!address ? <ConnectWallet/>:
        <>
        <h1>Proposals</h1>
          <div style={{display: 'flex', flexDirection: 'column', width: '100%', gap: '20px', marginTop: "50px"}}>
            {proposalsQuery?.proposals?.map((proposal: Proposal, proposalIndex: number) => {
              return (
                <div key={proposalIndex} style={{backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: "20px",  gap: "30px", display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between', padding: '50px 60px', height: 'fit-content'}}>
                  <GetVotingPower votingPower={votingPower} setVotingPower={setVotingPower} address={address} proposalID={proposalsQuery?.proposals[proposalIndex].id} index={proposalIndex}/>
                  <div key={proposalIndex} style={{flexWrap: 'wrap', gap: "30px", display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1}}>
                    <div style={{lineHeight: "30px"}}>
                      <h3 style={{margin: "0px"}}>{proposal.title}</h3>
                      <p style={{margin: "5px 0px 15px 0px", color: '#BBB', fontSize: '14px'}}> 
                        Created by {proposal.author.substring(0, 5) + '...' + address.substring(address.length - 5, address.length - 1)}
                      </p>
                      <p>{proposal.body} </p>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', flexGrow: 1}}>
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
                            className={styles.proposalButton}>
                              <p style={{margin: 0}}>
                                {choice}
                              </p>
                            <div key={choiceIndex}>
                              {Math.floor(proposal.scores[choiceIndex])} votes
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  {/* <div style={{width: '0.5px', backgroundColor: 'rgba(255,255,255,0.5)', alignSelf: 'stretch'}}/> */}
                  <div style={{ whiteSpace: 'nowrap', backgroundColor: 'rgba(255,255,255,0.05)', padding: '20px 30px', borderRadius: "20px", display: 'flex', justifyContent: 'space-between', gap: "20px"}}>
                    <div style={{color: '#BBB',}}>
                      <p>Start Date </p>
                      <p>End Date </p>
                    </div>
                    <div>
                      <p>{moment(proposal.start * 1000).format("lll")}</p>
                      <p>{moment(proposal.end * 1000).format("lll")}</p>
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
