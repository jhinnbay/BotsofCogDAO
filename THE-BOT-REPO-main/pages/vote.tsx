import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "../styles/Home.module.css";
import { useContract, useContractRead, useContractWrite } from "@thirdweb-dev/react";
import { useQuery, gql } from '@apollo/client';

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
    space(id: "radiantcapital.eth") {
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
        space_in: ["radiantcapital.eth"],
        state: "closed"
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
  const router = useRouter();
  const {loading, error, data} = useQuery(GET_PROPOSALS)
  console.log(data)
  const [choices, setChoices] = useState<number[]>([])

  const handleVote = (proposalIndex: number, choiceIndex: number) => {
    let tempChoices = [...choices]
    tempChoices[proposalIndex] = choiceIndex
    setChoices(tempChoices)
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>COMING SOON</h1>
      <div className={styles.nftBoxGrid}>
        {data?.proposals?.map((proposal: Proposal, proposalIndex: number) => {
          
          return (
            <div key={proposalIndex} className={styles.optionSelectBox}>
              <h2 className={styles.selectBoxTitle}>{proposal.title}</h2>
              <p> State: {proposal.state}</p>
              <p className={styles.selectBoxDescription}>{proposal.body}</p>
              {proposal.choices.map((choice, choiceIndex) => {
                return (
                  <button key={choiceIndex} onClick={() => {handleVote(proposalIndex, choiceIndex)}}>
                    {choice}
                  </button>
                )
              })}
              {/* <button onClick={() => handleVote(proposal.proposalId, true)}>Vote Yes</button>
              <button onClick={() => handleVote(proposal.proposalId, false)}>Vote No</button> */}
            </div> 
          )
        })}
      </div>
    </div>
  );
}
