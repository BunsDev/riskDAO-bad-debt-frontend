import React, { Component, Fragment } from "react";
import {observer} from "mobx-react"
import ChainIcon from "./ChainIcon";
import Platform from "./Platform";
import PlatformDetails from "./PlatformDetails";
import LastUpdate from "./LastUpdate";
import WhaleFriendly from "./WhaleFriendly";
import Details from "./Details";
import mainStore from "../stores/main.store";
import NoDataFound from "./NoDataFound";

const checkPlatformIcon = platform => {
  try{
    const icon = require(`../../public/images/platforms/${platform.toLowerCase()}.webp`)
    return icon
  } catch (e) {
    console.warn(platform.toLowerCase() + ".webp icon was not found")
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
    const headTitleMap = {
      platform: 'Name', 
      chain: 'Blockchain', 
      tvl: 'TVL', 
      total: 'Bad Debt', 
      ratio: 'Bad Debt Ratio', 
      updated: 'Last Update', 
      users: 'Details'
    }
    const body = data.filter(({platform})=> checkPlatformIcon(platform))
    if(body.length === 0) {
      return <NoDataFound/>
    }
    const head = Object.keys(body[0])
    const sortable = {
      tvl: true, 
      total: true, 
      ratio: true, 
      updated: true, 
    }
    return (
      <div style={containerStyle}>
        <table role="grid">
          <thead>
            <tr>
              {head.map((v)=> {
                if(sortable[v]){
                  return (
                    <td className="clickable" key={v} onClick={()=>mainStore.sortBy(v)}>
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                        <b>{headTitleMap[v]}</b>
                          <img style={{maxWidth: '24px', filter: `invert(${mainStore.blackMode? 1 : 0})`}} src={'/images/sort.svg'} alt='Sort'/>
                      </div>
                    </td> 
                  )
                } else {
                  return (
                    <td key={v}>
                      <b>{headTitleMap[v]}</b>
                    </td> 
                  )
                }
              }
            )}
            </tr>
          </thead>
          <tbody>
            {body.map((row, i)=> <Fragment key={row.platform+i}><tr>
              {Object.entries(row).map(([k, v])=> {
                if (k === 'platform'){
                  return (<td key={k+v}><Platform name={v}/></td>)
                }
                if (k === 'chain'){
                  return (<td key={k+v}><ChainIcon chain={v}/></td>)
                }
                if (k === 'tvl'){
                  return (<td key={k+v}>$<WhaleFriendly num={v}/></td>)
                }                   
                if (k === 'total'){
                  return (<td key={k+v}>$<WhaleFriendly num={v}/></td>)
                }                 
                if (k === 'ratio'){
                  return (<td key={k+v}>{v.toFixed(2)}%</td>)
                }                  
                if (k === 'updated'){
                  return (<td key={k+v}><LastUpdate timestamp={v}/></td>)
                }               
                if (k === 'users'){
                  return (<td key={k+v}><Details data={row}/></td>)
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