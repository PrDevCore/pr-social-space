import Script from "next/script";

/**
 * TrustBox widget — Review Collector.
 *
 * The bootstrap script is loaded via next/script (async) and the widget div
 * below is hydrated by Trustpilot's script on mount. The plain link inside
 * is the no-JS fallback.
 */
export default function TrustpilotWidget() {
  return (
    <>
      <Script
        src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
        strategy="lazyOnload"
      />
      <div
        className="trustpilot-widget"
        data-locale="en-US"
        data-template-id="56278e9abfbbba0bdcd568bc"
        data-businessunit-id="6a8865e6c1e85e3d70c1fd50"
        data-style-height="52px"
        data-style-width="100%"
        data-token="c5ccec27-5efd-4757-abb7-8b3ffc83d2d3"
      >
        <a
          href="https://www.trustpilot.com/review/prsocialhub.space"
          target="_blank"
          rel="noopener"
        >
          Trustpilot
        </a>
      </div>
    </>
  );
}
