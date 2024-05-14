import type { Story } from '@ladle/react';
import styled, { AnyStyledComponent } from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { StoryWrapper } from '.ladle/components';

export const ScrollAreasStory: Story<{}> = (args) => (
  <StoryWrapper>
    <$ScrollArea width="500px" height="700px">
      <p>
        Scroll area. (<code>layoutMixins.scrollArea</code>)
      </p>

      <$PlaceholderContent />

      <hr />

      <h2>Basic sticky area:</h2>

      <$StickyArea0 topHeight="4rem" bottomHeight="3rem">
        <$StickyHeader>Sticky header.</$StickyHeader>

        <p>
          Sticky area. (<code>layoutMixins.stickyArea0</code>)
        </p>

        <$PlaceholderContent />

        <$StickyFooter>Sticky footer.</$StickyFooter>
      </$StickyArea0>

      <$PlaceholderContent />

      <hr />

      <h2>Nested sticky area:</h2>

      <$StickyArea0 topHeight="4rem" bottomHeight="3rem">
        <$StickyHeader>Sticky header.</$StickyHeader>

        <p>
          Sticky area. (<code>layoutMixins.stickyArea0</code>)
        </p>

        <$PlaceholderContent />

        <$StickyArea1 topHeight="3rem" bottomHeight="2rem">
          <$StickyHeader>Nested sticky header.</$StickyHeader>

          <p>
            Nested sticky area. (<code>layoutMixins.stickyArea1</code>)
          </p>

          <$PlaceholderContent />

          <$StickyFooter>Nested sticky footer.</$StickyFooter>
        </$StickyArea1>

        <p>
          Sticky area. (<code>layoutMixins.stickyArea1</code>)
        </p>

        <$StickyFooter>Sticky footer.</$StickyFooter>
      </$StickyArea0>

      <$PlaceholderContent />

      <hr />

      <h2>Super-nested sticky area:</h2>

      <$StickyArea0 topHeight="4rem" bottomHeight="3rem">
        <$StickyHeader>Sticky header.</$StickyHeader>

        <p>
          Sticky area. (<code>layoutMixins.stickyArea0</code>)
        </p>

        <$StickyArea1 topHeight="3rem" bottomHeight="2rem">
          <$StickyHeader>Nested sticky header.</$StickyHeader>

          <$StickyArea2 topHeight="3rem" bottomHeight="2rem">
            <$StickyHeader>Super-nested sticky header.</$StickyHeader>

            <p>
              Super-nested sticky area. (<code>layoutMixins.stickyArea2</code>)
            </p>

            <$PlaceholderContent />

            <$StickyFooter>Super-nested sticky footer.</$StickyFooter>
          </$StickyArea2>

          <$StickyFooter>Nested sticky footer.</$StickyFooter>
        </$StickyArea1>

        <p>
          Sticky area. (<code>layoutMixins.stickyArea1</code>)
        </p>

        <$StickyFooter>Sticky footer.</$StickyFooter>
      </$StickyArea0>

      <hr />

      <h2>Nested scroll area:</h2>

      <$StickyArea0 topHeight="4rem" bottomHeight="3rem">
        <$StickyHeader>Sticky header.</$StickyHeader>

        <p>
          Sticky area. (<code>layoutMixins.stickyArea0</code>)
        </p>

        <$StickyArea1 topHeight="3rem" bottomHeight="2rem">
          <$StickyHeader>Nested sticky header.</$StickyHeader>

          <$StickyArea2 topHeight="3rem" bottomHeight="2rem">
            <$StickyHeader>Super-nested sticky header.</$StickyHeader>

            <p>
              Super-nested sticky area. (<code>layoutMixins.stickyArea2</code>)
            </p>

            <$ScrollArea height="300px">
              <p>
                Nested scroll area. (<code>layoutMixins.scrollArea</code>)
              </p>

              <$StickyArea0 topHeight="4rem" bottomHeight="3rem">
                <$StickyHeader>Sticky header.</$StickyHeader>

                <p>
                  Sticky area. (<code>layoutMixins.stickyArea0</code>)
                </p>

                <$PlaceholderContent />

                <$StickyFooter>Sticky footer.</$StickyFooter>
              </$StickyArea0>
            </$ScrollArea>

            <$StickyFooter>Super-nested sticky footer.</$StickyFooter>
          </$StickyArea2>

          <$StickyFooter>Nested sticky footer.</$StickyFooter>
        </$StickyArea1>

        <p>
          Sticky area. (<code>layoutMixins.stickyArea1</code>)
        </p>

        <$StickyFooter>Sticky footer.</$StickyFooter>
      </$StickyArea0>
    </$ScrollArea>
  </StoryWrapper>
);
const $ScrollArea = styled.section<{ width: string; height: string }>`
  ${layoutMixins.container}
  ${layoutMixins.scrollArea}

  width: ${({ width }) => width};
  height: ${({ height }) => height};

  display: grid;
  padding: 1.5rem;
  gap: 1rem;

  background: var(--color-layer-1);
  border: 1px solid;
  border-radius: 1.5rem;

  h2 {
    font-size: 1.5em;
    font-weight: bold;
  }
`;

const $StickyHeader = styled.header<{}>`
  ${layoutMixins.stickyHeader}

  ${layoutMixins.row}
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  gap: 1rem;

  font-size: 1.25em;

  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
`;

const $StickyFooter = styled.footer<{}>`
  ${layoutMixins.stickyFooter}

  ${layoutMixins.row}
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  gap: 1rem;

  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
`;

const $StickyArea0 = styled.section<{ topHeight: string; bottomHeight: string }>`
  ${layoutMixins.stickyArea0}
  --stickyArea0-topHeight: ${({ topHeight }) => topHeight};
  --stickyArea0-bottomHeight: ${({ bottomHeight }) => bottomHeight};
  --stickyArea0-background: var(--color-layer-2);

  isolation: isolate;

  display: grid;
  padding: 1.5rem;
  gap: 1rem;

  border-radius: 1rem;
`;

const $StickyArea1 = styled.section<{ topHeight: string; bottomHeight: string }>`
  ${layoutMixins.stickyArea1}
  --stickyArea1-topHeight: ${({ topHeight }) => topHeight};
  --stickyArea1-bottomHeight: ${({ bottomHeight }) => bottomHeight};
  --stickyArea1-background: var(--color-layer-3);

  isolation: isolate;

  display: grid;
  padding: 1.5rem;
  gap: 1rem;

  border-radius: 0.5rem;
`;

const $StickyArea2 = styled.section<{ topHeight: string; bottomHeight: string }>`
  ${layoutMixins.stickyArea2}
  --stickyArea2-topHeight: ${({ topHeight }) => topHeight};
  --stickyArea2-bottomHeight: ${({ bottomHeight }) => bottomHeight};
  --stickyArea2-background: var(--color-layer-4);

  isolation: isolate;

  display: grid;
  padding: 1.5rem;
  gap: 1rem;

  border-radius: 0.5rem;
`;

const $PlaceholderContent = styled.p`
  opacity: 0.3;

  &:before {
    content: 'Content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content';
  }
`;
