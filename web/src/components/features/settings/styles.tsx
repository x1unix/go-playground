import {
  FontWeights,
  FontSizes,
  mergeStyleSets
} from '@fluentui/react';

export const settingsSectionStyles = mergeStyleSets({
  title: {
    fontSize: FontSizes.xLarge
  },
  section: {
    marginBottom: '25px'
  }
});

export const settingsPropStyles = mergeStyleSets({
  title: {
    fontWeight: FontWeights.bold,
  },
  container: {
    marginTop: '10px'
  },
  block: {
    marginTop: '15px',
  },
  description: {
    marginTop: '5px'
  }
});
