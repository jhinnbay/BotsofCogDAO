import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "../styles/Home.module.css";
import { useContract, useContractRead, useContractWrite, useAddress, ConnectWallet } from "@thirdweb-dev/react";
import { useQuery, gql, useLazyQuery } from '@apollo/client';
import GetVotingPower from "../components/GetVotingPower";

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
  const router = useRouter();
  const address = useAddress()
  const proposalsQuery = useQuery(GET_PROPOSALS).data
  console.log(proposalsQuery)
  const [hasVoted, setHasVoted] = useState<boolean[]>([])
  const [votingPower, setVotingPower] = useState<number[]>([])
  const {loading, error, data} = useQuery(GET_VOTING_POWER, {variables: {voter: address, proposal: proposalsQuery?.proposals[0].id}})

  console.log(votingPower)

  const handleVote = (proposalIndex: number, choiceIndex: number) => {
    let tempChoices = [...hasVoted]
    tempChoices[proposalIndex] = true
    setHasVoted(tempChoices)
    
    // VOTING LOGIC HERE
  }

  return (
    <div className={styles.container}>
      {!address ? <ConnectWallet/>:
        <>
          <h1 className={styles.h1}>COMING SOON</h1>
          <div className={styles.nftBoxGrid}>
            {proposalsQuery?.proposals?.map((proposal: Proposal, proposalIndex: number) => {
              
              return (
                <div key={proposalIndex} className={styles.optionSelectBox}>
                  <h2 className={styles.selectBoxTitle}>{proposal.title}</h2>
                  <p> {proposal.state}</p>
                  <p className={styles.selectBoxDescription}>{proposal.body}</p>

                  {proposalsQuery?.proposals.map((proposal: Proposal, index: number) => {
                    return (
                      <GetVotingPower key={index} votingPower={votingPower} setVotingPower={setVotingPower} address={address} proposalID={proposalsQuery?.proposals[index].id} index={index}/>
                    )
                  })}

                  {proposal.choices.map((choice, choiceIndex) => {
                    return (
                      hasVoted[proposalIndex]?
                        <div key={choiceIndex}>
                          {choice}: {Math.floor(proposal.scores[choiceIndex])} votes
                        </div>:
                        <button key={choiceIndex} onClick={() => {handleVote(proposalIndex, choiceIndex)}}>
                          {choice}
                        </button>
                    )
                  })}
                </div> 
              )
            })}
          </div>
        </>
      }
    </div>
  );
}
