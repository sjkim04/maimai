import styled from "@emotion/styled";
import { ellipsis } from "polished";
import { SongDatabaseItemWithRecord } from "../../const/songDatabase";
import { wanpaku } from "../../styles/fonts/wanpaku";
import { difficultyBorderColor } from "../../utils/difficulty";
import RankChip from "../chip/RankChip";
import LevelMarker from "./LevelMarker";
import { MUSIC_DX_URL, MUSIC_STD_URL } from "../../const/chartType";

const RecordContainer = styled.div`
  min-width: 0;
  border: 1px solid;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const JacketContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
`;

const Jacket = styled.img`
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  user-select: none;
`;

const Type = styled.img`
  position: absolute;
  left: 0.5em;
  top: 0.5em;
  display: block;
  height: 1em;
`;

const LevelMarkerContainer = styled.div`
  width: 100%;
  bottom: -1px;
`;

const TitleContainer = styled.div`
  ${ellipsis()}
  width: 100%;
  background: #084484;
  color: white;
  padding: 8px 8px;
  font-weight: 600;
  text-align: center;

  @media (max-width: 640px) {
    font-size: 80%;
  }
`;

const AchievementContainer = styled(TitleContainer)`
  ${wanpaku}
  background: #093063;
  font-size: 80%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  @media (max-width: 640px) {
    font-size: 60%;
  }
`;

const RankContainer = styled(RankChip)`
  position: absolute;
  top: 0.5em;
  right: 0.5em;
  font-size: 80%;
  font-weight: 800;
`;

interface Props {
  song: SongDatabaseItemWithRecord;
}

const RecordSummary = ({ song }: Props) => {
  const { jacketKey, type, difficulty, title, record } = song;
  const { achievement, rank } = record;

  return (
    <RecordContainer
      style={{
        borderColor: difficultyBorderColor(difficulty),
      }}
    >
      <JacketContainer>
        <Jacket
          src={`https://maimaidx.jp/maimai-mobile/img/Music/${jacketKey}.png`}
        />
        <Type src={type === "DX" ? MUSIC_DX_URL : MUSIC_STD_URL} alt={type} />
        <RankContainer rank={rank} />
      </JacketContainer>
      <LevelMarkerContainer>
        <LevelMarker song={song} />
      </LevelMarkerContainer>
      <TitleContainer>{title}</TitleContainer>
      <AchievementContainer>
        <span>
          {(achievement / 10000).toLocaleString(undefined, {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4,
          })}
          %
        </span>
        <span>{rank}</span>
      </AchievementContainer>
    </RecordContainer>
  );
};

export default RecordSummary;
