import styled, { AnyStyledComponent } from 'styled-components';
import type { Story } from '@ladle/react';

import { StoryWrapper } from '.ladle/components';
import { layoutMixins } from '@/styles/layoutMixins';

export const ScrollAreasStory: Story<{}> = (args) => (
  <StoryWrapper>
    <Styled.ScrollArea width="500px" height="700px">
      <p>
        Scroll area. (<code>layoutMixins.scrollArea</code>)
      </p>

      <Styled.PlaceholderContent />

      <hr />

      <h2>Basic sticky area:</h2>

      <Styled.StickyArea0 topHeight="4rem" bottomHeight="3rem">
        <Styled.StickyHeader>Sticky header.</Styled.StickyHeader>

        <p>
          Sticky area. (<code>layoutMixins.stickyArea0</code>)
        </p>

        <Styled.PlaceholderContent />

        <Styled.StickyFooter>Sticky footer.</Styled.StickyFooter>
      </Styled.StickyArea0>

      <Styled.PlaceholderContent />

      <hr />

      <h2>Nested sticky area:</h2>

      <Styled.StickyArea0 topHeight="4rem" bottomHeight="3rem">
        <Styled.StickyHeader>Sticky header.</Styled.StickyHeader>

        <p>
          Sticky area. (<code>layoutMixins.stickyArea0</code>)
        </p>

        <Styled.PlaceholderContent />

        <Styled.StickyArea1 topHeight="3rem" bottomHeight="2rem">
          <Styled.StickyHeader>Nested sticky header.</Styled.StickyHeader>

          <p>
            Nested sticky area. (<code>layoutMixins.stickyArea1</code>)
          </p>

          <Styled.PlaceholderContent />

          <Styled.StickyFooter>Nested sticky footer.</Styled.StickyFooter>
        </Styled.StickyArea1>

        <p>
          Sticky area. (<code>layoutMixins.stickyArea1</code>)
        </p>

        <Styled.StickyFooter>Sticky footer.</Styled.StickyFooter>
      </Styled.StickyArea0>

      <Styled.PlaceholderContent />

      <hr />

      <h2>Super-nested sticky area:</h2>

      <Styled.StickyArea0 topHeight="4rem" bottomHeight="3rem">
        <Styled.StickyHeader>Sticky header.</Styled.StickyHeader>

        <p>
          Sticky area. (<code>layoutMixins.stickyArea0</code>)
        </p>

        <Styled.StickyArea1 topHeight="3rem" bottomHeight="2rem">
          <Styled.StickyHeader>Nested sticky header.</Styled.StickyHeader>

          <Styled.StickyArea2 topHeight="3rem" bottomHeight="2rem">
            <Styled.StickyHeader>Super-nested sticky header.</Styled.StickyHeader>

            <p>
              Super-nested sticky area. (<code>layoutMixins.stickyArea2</code>)
            </p>

            <Styled.PlaceholderContent />

            <Styled.StickyFooter>Super-nested sticky footer.</Styled.StickyFooter>
          </Styled.StickyArea2>

          <Styled.StickyFooter>Nested sticky footer.</Styled.StickyFooter>
        </Styled.StickyArea1>

        <p>
          Sticky area. (<code>layoutMixins.stickyArea1</code>)
        </p>

        <Styled.StickyFooter>Sticky footer.</Styled.StickyFooter>
      </Styled.StickyArea0>

      <hr />

      <h2>Nested scroll area:</h2>

      <Styled.StickyArea0 topHeight="4rem" bottomHeight="3rem">
        <Styled.StickyHeader>Sticky header.</Styled.StickyHeader>

        <p>
          Sticky area. (<code>layoutMixins.stickyArea0</code>)
        </p>

        <Styled.StickyArea1 topHeight="3rem" bottomHeight="2rem">
          <Styled.StickyHeader>Nested sticky header.</Styled.StickyHeader>

          <Styled.StickyArea2 topHeight="3rem" bottomHeight="2rem">
            <Styled.StickyHeader>Super-nested sticky header.</Styled.StickyHeader>

            <p>
              Super-nested sticky area. (<code>layoutMixins.stickyArea2</code>)
            </p>

            <Styled.ScrollArea height="300px">
              <p>
                Nested scroll area. (<code>layoutMixins.scrollArea</code>)
              </p>

              <Styled.StickyArea0 topHeight="4rem" bottomHeight="3rem">
                <Styled.StickyHeader>Sticky header.</Styled.StickyHeader>

                <p>
                  Sticky area. (<code>layoutMixins.stickyArea0</code>)
                </p>

                <Styled.PlaceholderContent />

                <Styled.StickyFooter>Sticky footer.</Styled.StickyFooter>
              </Styled.StickyArea0>
            </Styled.ScrollArea>

            <Styled.StickyFooter>Super-nested sticky footer.</Styled.StickyFooter>
          </Styled.StickyArea2>

          <Styled.StickyFooter>Nested sticky footer.</Styled.StickyFooter>
        </Styled.StickyArea1>

        <p>
          Sticky area. (<code>layoutMixins.stickyArea1</code>)
        </p>

        <Styled.StickyFooter>Sticky footer.</Styled.StickyFooter>
      </Styled.StickyArea0>
    </Styled.ScrollArea>
  </StoryWrapper>
);

const Styled: Record<string, AnyStyledComponent> = {};

Styled.ScrollArea = styled.section<{ width: string, height: string, }>`
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

Styled.StickyHeader = styled.header<{}>`
  ${layoutMixins.stickyHeader}

  ${layoutMixins.row}
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  gap: 1rem;

  font-size: 1.25em;

  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
`;

Styled.StickyFooter = styled.footer<{}>`
  ${layoutMixins.stickyFooter}

  ${layoutMixins.row}
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  gap: 1rem;

  background: rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
`;

Styled.StickyArea0 = styled.section<{ topHeight: string; bottomHeight: string }>`
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

Styled.StickyArea1 = styled.section<{ topHeight: string; bottomHeight: string }>`
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

Styled.StickyArea2 = styled.section<{ topHeight: string; bottomHeight: string }>`
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

Styled.PlaceholderContent = styled.p`
  opacity: 0.3;

  &:before {
    content: 'Content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content content';
  }
`;
