import { useQuery, gql } from "@apollo/client"
import { useEffect } from 'react'

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

const GetVotingPower = ({votingPower, setVotingPower, address, proposalID, index}: any) => {

  const {loading, error, data} = useQuery(GET_VOTING_POWER, {variables: {voter: address, proposal: proposalID}})
  useEffect(() => {
    if (data) {
      let tempVotingPower = [...votingPower]
      tempVotingPower[index] = data?.vp.vp
      setVotingPower(tempVotingPower)
    }
    // console.log(data)
  }, [data])

  return <></>
}

export default GetVotingPower