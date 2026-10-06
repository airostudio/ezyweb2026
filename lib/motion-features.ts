/**
 * framer-motion feature bundle, loaded asynchronously by <LazyMotion> so the
 * animation engine never blocks first paint. domMax (vs domAnimation) adds
 * layout/layoutId animations, used by nav pills and list reflows.
 */
import { domMax } from "framer-motion";

export default domMax;
