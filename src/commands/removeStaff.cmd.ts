import { ChatInputCommandInteraction, Client, EmbedBuilder, GuildMember } from "discord.js";
import { generateAllowedMentions } from "../actions/generateAllowedMentions.action";
import { DatabaseData } from "../misc/types";
import { Database } from "@firebase/database-types";
import { fail } from "../actions/fail.action";
import { GetAlias } from "../actions/getalias.action";
import { interp } from "../actions/interp.action";
import { GetStr } from "../actions/i18n.action";
import { InteractionData, VerifyInteraction } from "../actions/verify.action";

export const RemoveStaffCmd = async (client: Client, db: Database, dbdata: DatabaseData, interaction: ChatInputCommandInteraction) => {
  if (!interaction.isCommand()) return;
  const { options, guildId, locale } = interaction;

  await interaction.deferReply();

  const alias = await GetAlias(db, dbdata, interaction, options.getString('project')!);
  const abbreviation = options.getString('abbreviation')!.toUpperCase();

  let verification = await VerifyInteraction(dbdata, interaction, alias);
  if (!verification) return;
  const { projects, project } = InteractionData(dbdata, interaction, alias);

  let success = false;
  for (let pos in projects[project].keyStaff)
    if (projects[project].keyStaff[pos].role.abbreviation == abbreviation) {
      success = true;
      db.ref(`/Projects/${guildId}/${project}`).child("keyStaff").child(pos).remove();
    }

if (!success)
  return fail(interp(GetStr(dbdata.i18n, 'noSuchTask', interaction.locale), { '$ABBREVIATION': abbreviation }), interaction);


  const episodes = projects[project].episodes;
  for (let key in episodes) {
    for (let task in episodes[key].tasks) {
      if (episodes[key].tasks[task].abbreviation == abbreviation)
        db.ref(`/Projects/${guildId}/${project}/episodes/${key}/tasks`).child(task).remove();
    }
  }

  const embed = new EmbedBuilder()
    .setTitle(GetStr(dbdata.i18n, 'projectModificationTitle', locale))
    .setDescription(interp(GetStr(dbdata.i18n, 'removeStaff', interaction.locale), { '$ABBREVIATION': abbreviation }))
    .setColor(0xd797ff);
  await interaction.editReply({ embeds: [embed], allowedMentions: generateAllowedMentions([[], []]) });
}
