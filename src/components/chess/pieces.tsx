import React from "react";

const pieceStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
  pointerEvents: "none",
  display: "block",
  touchAction: "none",
  userSelect: "none",
  WebkitUserSelect: "none",
};

const makePiece = (src: string, alt: string, size = "86%") =>
  function ChessPiece() {
    return (
      <div
        className="camp-piece-wrapper"
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
        }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{
            ...pieceStyle,
            width: size,
            height: size,
            maxWidth: size,
            maxHeight: size,
          }}
        />
      </div>
    );
  };

export const customPieces = {
  wP: makePiece("/wp_no_bg.png", "White pawn", "74%"),
  wN: makePiece("/wh_no_bg.png", "White knight", "86%"),
  wK: makePiece("/wk_no_bg.png", "White king", "86%"),
  wB: makePiece("/wb_no_bg.png", "White bishop", "86%"),
  wR: makePiece("/wr_no_bg.png", "White rook", "86%"),
  wQ: makePiece("/wq_no_bg.png", "White queen", "86%"),
  bP: makePiece("/bp_no_bg.png", "Black pawn", "86%"),
  bN: makePiece("/bh_no_bg.png", "Black knight", "86%"),
  bK: makePiece("/bk_no_bg.png", "Black king", "86%"),
  bB: makePiece("/bb_no_bg.png", "Black bishop", "86%"),
  bR: makePiece("/br_no_bg.png", "Black rook", "86%"),
  bQ: makePiece("/bq_no_bg.png", "Black queen", "86%"),
};
