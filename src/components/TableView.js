import React, { Component, Fragment } from "react";
import {observer} from "mobx-react"
import ChainIcon from "./ChainIcon";
import Platform from "./Platform";
import PlatformDetails from "./PlatformDetails";
import LastUpdate from "./LastUpdate";
import WhaleFriendly from "./WhaleFriendly";
import Details from "./Details";
import mainStore from "../stores/main.store";

const checkPlatformIcon = platform => {
  try{
    const icon = require(`../../public/images/platforms/${platform.toLowerCase()}.webp`)
    return icon
  } catch (e) {
    return null;
  }
}

const containerStyle = {
  overflowY: 'auto'
}

class TableView extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    const data = this.props.data
    const head = ['Name', 'Blockchains', 'TVL', 'Bad Debt (USD)', 'Last Update', 'Details']
    const body = data.filter(({platform})=> checkPlatformIcon(platform))
    return (
      <div style={containerStyle}>
        <table role="grid">
        <thead>
          <tr>
            {head.map(v=> <td key={v}>{v}</td> )}
          </tr>
        </thead>
        <tbody>
          {body.map(row=> <Fragment key={row.platform}><tr>
            {Object.entries(row).map(([k, v])=> {
              if (k === 'platform'){
                return (<td key={v}><Platform name={v}/></td>)
              }
              if (k === 'chain'){
                return (<td key={v}><ChainIcon chain={v}/></td>)
              }
              if (k === 'tvl'){
                return (<td key={v}>$<WhaleFriendly num={v}/></td>)
              }                   
              if (k === 'total'){
                return (<td key={v}>$<WhaleFriendly num={v}/></td>)
              }                  
              if (k === 'updated'){
                return (<td key={v}><LastUpdate timestamp={v}/></td>)
              }               
              if (k === 'users'){
                return (<td key={v}><Details data={row}/></td>)
              }            
            })}
          </tr>
          {row.platform === mainStore.tableRowDetails && <tr><td colSpan='7'><PlatformDetails name={row.platform}/></td></tr>}
          </Fragment>)}
        </tbody>
        </table>
      </div>
    )
  }
}

export default observer(TableView)