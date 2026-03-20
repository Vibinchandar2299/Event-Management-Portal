import React, { useState, useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  applyEdgeChanges,
  applyNodeChanges,
} from "react-flow-renderer";

const initialNodes = [
  {
    id: "1",
    type: "input",
    data: {
      label: <strong className="text-xl text-nowrap">Basic Event</strong>,
    },
    position: { x: 50, y: 50 },
  },
  {
    id: "2",
    data: {
      label: (
        <strong className="text-xl text-nowrap w-96">Communication</strong>
      ),
    },
    position: { x: 250, y: 50 },
  },
  {
    id: "3",
    data: { label: <strong className="text-xl text-nowrap">Transport</strong> },
    position: { x: 450, y: 50 },
  },
  {
    id: "4",
    data: { label: <strong className="text-xl text-nowrap">Food</strong> },
    position: { x: 650, y: 50 },
  },
  {
    id: "5",
    data: {
      label: <strong className="text-xl text-nowrap ">Guest Room</strong>,
    },
    position: { x: 850, y: 50 },
  },
  {
    id: "6",
    type: "output",
    data: { label: <strong className="text-lg">Final Submission</strong> },
    position: { x: 1050, y: 50 },
  },
];

const initialEdges = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e2-3", source: "2", target: "3", animated: true },
  { id: "e3-4", source: "3", target: "4", animated: true },
  { id: "e4-5", source: "4", target: "5", animated: true },
  { id: "e5-6", source: "5", target: "6", animated: true },
];

function PipelineComponent() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  return (
    <div className="h-[400px] w-full rounded-2xl border border-indigo-900/10 bg-indigo-50/70 p-5 shadow-inner">
      <h2 className="mb-3 text-center text-2xl font-semibold text-indigo-700">
        Event Form Pipeline
      </h2>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <MiniMap
          nodeColor={(node) => "#4F46E5"}
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
        />
      </ReactFlow>
    </div>
  );
}

const TermsandCondition = () => {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 p-4 md:p-8">
      <div className="rounded-2xl border border-indigo-900/10 bg-white pt-10 shadow-xl">
        <h1 className="mb-6 text-center text-3xl font-bold text-indigo-600 md:text-4xl">
          Terms & Conditions
        </h1>

        <p className="mb-6 px-6 text-base text-gray-700 md:px-10 md:text-lg">
          Welcome to our Event Management Platform. Below are the terms and
          conditions governing the workflow of our event forms.
        </p>

        {/* Pipeline UI */}
        <div className="px-6 md:px-10">
          <PipelineComponent />
        </div>

        <div className="mt-8 space-y-4 px-6 pb-8 md:px-10">
          {[
            {
              icon: "📌",
              title: "Basic Event Details Form",
              desc: "Mandatory first form, captures essential event details.",
              bg: "bg-indigo-100",
            },
            {
              icon: "🖼️",
              title: "Communication Form",
              desc: "Handles posters, banners, and streaming media.",
              bg: "bg-blue-100",
            },
            {
              icon: "🚗",
              title: "Transport Form",
              desc: "Manages guest pickups and drop-offs.",
              bg: "bg-green-100",
            },
            {
              icon: "🍽️",
              title: "Food Form",
              desc: "Specifies meal details for guests.",
              bg: "bg-yellow-100",
            },
            {
              icon: "🏨",
              title: "Guest Room Form",
              desc: "Manages accommodations for overnight guests.",
              bg: "bg-purple-100",
            },
            {
              icon: "✅",
              title: "Final Submission",
              desc: "Completes the process after all forms are filled.",
              bg: "bg-red-100",
            },
          ].map(({ icon, title, desc, bg }, index) => (
            <div key={index} className={`rounded-xl p-5 shadow-sm ${bg}`}>
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <span>{icon}</span> {title}
              </h2>
              <p className="text-gray-600 mt-2">{desc}</p>
            </div>
          ))}
        </div>

        <p className="pb-8 text-center italic text-gray-700">
          * The system automatically transitions between forms based on
          submissions.
        </p>
      </div>
    </div>
  );
};

export default TermsandCondition;
