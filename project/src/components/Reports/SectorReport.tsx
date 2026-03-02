import { useMemo } from 'react';
import { FamilyMember, Household } from '../../types';
import { PieChart, Calendar } from 'lucide-react';

interface SectorReportProps { members: FamilyMember[]; households: Household[]; }

export function SectorReport({ members }: SectorReportProps) {
  const sectorStats = useMemo(() => {
    const stats = members.reduce((acc, member) => {
      if (!acc[member.sector]) acc[member.sector] = { total:0, cooperativeMembers:0, voters:0, householdLeaders:0, ageSum:0, ageCount:0, households:new Set<string>() };
      const stat = acc[member.sector];
      stat.total+=1; if(member.is_cooperative_member)stat.cooperativeMembers+=1; if(member.is_voter)stat.voters+=1; if(member.is_household_leader)stat.householdLeaders+=1;
      if(member.age){stat.ageSum+=member.age;stat.ageCount+=1;} if(member.household_id)stat.households.add(member.household_id);
      return acc;
    }, {} as Record<string,{total:number;cooperativeMembers:number;voters:number;householdLeaders:number;ageSum:number;ageCount:number;households:Set<string>}>);
    return Object.entries(stats).map(([sector,data])=>({sector,total:data.total,cooperativeMembers:data.cooperativeMembers,voters:data.voters,householdLeaders:data.householdLeaders,averageAge:data.ageCount>0?data.ageSum/data.ageCount:0,households:data.households.size,membershipRate:data.total>0?(data.cooperativeMembers/data.total)*100:0,votingRate:data.total>0?(data.voters/data.total)*100:0})).sort((a,b)=>b.total-a.total);
  }, [members]);

  const ageDistributionBySector = useMemo(() => {
    const distribution = {} as Record<string,Record<string,number>>;
    members.forEach(member=>{
      if(!member.age)return; let ageGroup='Unknown';
      if(member.age<18)ageGroup='Under 18'; else if(member.age<30)ageGroup='18-29'; else if(member.age<45)ageGroup='30-44'; else if(member.age<60)ageGroup='45-59'; else ageGroup='60+';
      if(!distribution[member.sector])distribution[member.sector]={};
      distribution[member.sector][ageGroup]=(distribution[member.sector][ageGroup]||0)+1;
    }); return distribution;
  }, [members]);

  const sectorColors: Record<string,{bg:string;light:string;text:string}> = { 'General':{bg:'bg-gray-500',light:'bg-gray-100',text:'text-gray-700'}, 'Youth':{bg:'bg-blue-500',light:'bg-blue-100',text:'text-blue-700'}, 'PWD':{bg:'bg-purple-500',light:'bg-purple-100',text:'text-purple-700'}, 'Senior Citizen':{bg:'bg-orange-500',light:'bg-orange-100',text:'text-orange-700'}, 'LGBTQ+':{bg:'bg-pink-500',light:'bg-pink-100',text:'text-pink-700'}, 'Indigenous People':{bg:'bg-green-500',light:'bg-green-100',text:'text-green-700'}, 'Solo Parent':{bg:'bg-yellow-500',light:'bg-yellow-100',text:'text-yellow-700'} };
  const totalMembers = members.length;
  const maxSectorSize = Math.max(...sectorStats.map(stat=>stat.total));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><PieChart className="w-5 h-5" />Sector Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{sectorStats.map(stat=>{const colors=sectorColors[stat.sector]||sectorColors['General'];const pct=(stat.total/totalMembers)*100;return(<div key={stat.sector} className={`${colors.light} rounded-lg p-4`}><div className="flex items-center justify-between mb-3"><h4 className={`font-semibold ${colors.text}`}>{stat.sector}</h4><div className={`w-8 h-8 ${colors.bg} rounded-full flex items-center justify-center`}><span className="text-white text-sm font-bold">{stat.total}</span></div></div><div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-gray-600">Percentage:</span><span className={`font-medium ${colors.text}`}>{pct.toFixed(1)}%</span></div><div className="flex justify-between"><span className="text-gray-600">TROPA Members:</span><span className={`font-medium ${colors.text}`}>{stat.cooperativeMembers}</span></div><div className="flex justify-between"><span className="text-gray-600">Membership Rate:</span><span className={`font-medium ${colors.text}`}>{stat.membershipRate.toFixed(1)}%</span></div></div></div>);})}</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Sector Analysis</h3>
        <div className="space-y-4">{sectorStats.map(stat=>{const colors=sectorColors[stat.sector]||sectorColors['General'];const pct=maxSectorSize>0?(stat.total/maxSectorSize)*100:0;return(<div key={stat.sector} className="border border-gray-100 rounded-lg p-4"><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-3"><div className={`w-4 h-4 ${colors.bg} rounded-full`}></div><h4 className="font-semibold text-gray-900">{stat.sector}</h4></div><div className="text-right"><p className="text-lg font-bold text-gray-900">{stat.total}</p><p className="text-xs text-gray-500">members</p></div></div><div className="bg-gray-100 rounded-full h-2 mb-4"><div className={`h-2 rounded-full ${colors.bg} transition-all duration-300`} style={{width:`${pct}%`}}></div></div><div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm"><div><p className="text-gray-600">TROPA Members</p><p className="font-medium text-gray-900">{stat.cooperativeMembers}</p><p className="text-xs text-green-600">{stat.membershipRate.toFixed(1)}%</p></div><div><p className="text-gray-600">Voters</p><p className="font-medium text-gray-900">{stat.voters}</p><p className="text-xs text-blue-600">{stat.votingRate.toFixed(1)}%</p></div><div><p className="text-gray-600">Leaders</p><p className="font-medium text-gray-900">{stat.householdLeaders}</p></div><div><p className="text-gray-600">Households</p><p className="font-medium text-gray-900">{stat.households}</p></div><div><p className="text-gray-600">Avg Age</p><p className="font-medium text-gray-900">{stat.averageAge>0?stat.averageAge.toFixed(1):'N/A'}</p></div></div></div>);})}</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Calendar className="w-5 h-5" />Age Distribution by Sector</h3>
        <div className="space-y-6">{Object.entries(ageDistributionBySector).map(([sector,ageGroups])=>{const colors=sectorColors[sector]||sectorColors['General'];const totalInSector=Object.values(ageGroups).reduce((sum,count)=>sum+count,0);return(<div key={sector} className="border border-gray-100 rounded-lg p-4"><h4 className={`font-semibold mb-3 ${colors.text}`}>{sector}</h4><div className="space-y-2">{['Under 18','18-29','30-44','45-59','60+'].map(ageGroup=>{const count=ageGroups[ageGroup]||0;const pct=totalInSector>0?(count/totalInSector)*100:0;return(<div key={ageGroup} className="flex items-center gap-4"><div className="w-16 text-sm text-gray-600">{ageGroup}</div><div className="flex-1 bg-gray-100 rounded-full h-2"><div className={`h-2 rounded-full ${colors.bg} transition-all duration-300`} style={{width:`${pct}%`}}></div></div><div className="w-20 text-right text-sm"><span className="font-medium text-gray-900">{count}</span><span className="text-gray-500 ml-1">({pct.toFixed(1)}%)</span></div></div>);})}</div></div>);})}</div>
      </div>
    </div>
  );
}
