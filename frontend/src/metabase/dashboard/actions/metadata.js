import Questions from "metabase/entities/questions";
import { getLinkTargets } from "metabase/lib/click-behavior";
import { loadMetadataForCard } from "metabase/questions/actions";

import { isVirtualDashCard } from "../utils";

export const loadMetadataForDashcards = dashcards => async dispatch => {
  const cards = dashcards
    .filter(dc => !isVirtualDashCard(dc)) // exclude text cards
    .flatMap(dc => [dc.card].concat(dc.series || []));

  await Promise.all([
    dispatch(loadMetadataForCards(cards)),
    dispatch(loadMetadataForLinkedTargets(dashcards)),
  ]);
};

const loadMetadataForCards = cards => (dispatch, getState) => {
  return Promise.all(
    cards
      .filter(card => card.dataset_query) // exclude queries without perms
      .map(card => dispatch(loadMetadataForCard(card))),
  );
};

const loadMetadataForLinkedTargets =
  dashCards => async (dispatch, getState) => {
    const linkTargets = dashCards.flatMap(card =>
      getLinkTargets(card.visualization_settings),
    );
    const fetchRequests = linkTargets
      .map(({ entity, entityId }) =>
        entity.actions.fetch({ id: entityId }, { noEvent: true }),
      )
      .map(action => dispatch(action).catch(e => console.error(e)));

    await Promise.all(fetchRequests);

    const cards = linkTargets
      .filter(({ entityType }) => entityType === "question")
      .map(({ entityId }) =>
        Questions.selectors.getObject(getState(), { entityId })?.card(),
      )
      .filter(card => card != null);

    await dispatch(loadMetadataForCards(cards));
  };
