import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CloudCog } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setEventData, clearEventData } from "./redux/EventSlice";

const CommunicationForm = ({ eventData: propEventData, nextForm }) => {
  console.log("CommunicationForm - currentEventId at mount:", localStorage.getItem('currentEventId'));
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();


  
  // Check if there's an active event at the very beginning
  const endformId = localStorage.getItem('endformId');
  const currentEventId = localStorage.getItem('currentEventId');
  const isEditMode = localStorage.getItem('isEditMode') === 'true';
  const hasActiveEvent = currentEventId; // Only need currentEventId for new event creation
  
  // For new event creation, allow access to the form even without currentEventId
  // The form will be populated when the Basic Event Form creates the event
  const isNewEventCreation = !endformId && !currentEventId;
  
  // Only read from Redux if there's an active event AND it's an existing event (has endformId)
  const reduxEventData = useSelector((state) => {
    if (!hasActiveEvent || !endformId) return {}; // Don't read from Redux for new events
    return state.event?.event?.communicationform || {};
  });

  const [isLoading, setIsLoading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [formData, setFormData] = useState({
    photography: false,
    videography: false,
  });
  const [commId, setCommId] = useState('');

  const [isFormEditable, setIsFormEditable] = useState(false);
  const [originalFormData, setOriginalFormData] = useState(null);
  const [originalSelectedOptions, setOriginalSelectedOptions] = useState(null);

  useEffect(() => {
    setIsFormEditable(!isEditMode);
  }, [isEditMode]);

  const handleEditToggle = () => {
    if (!isFormEditable) {
      setOriginalFormData(JSON.parse(JSON.stringify(formData)));
      setOriginalSelectedOptions(JSON.parse(JSON.stringify(selectedOptions)));
      setIsFormEditable(true);
    }
  };

  const handleCancel = () => {
    if (originalFormData) {
      setFormData(originalFormData);
      setSelectedOptions(originalSelectedOptions || {});
    }
    setIsFormEditable(false);
  };

  // Define canEdit at the top to avoid temporal dead zone
  const userDept = (localStorage.getItem("user_dept") || "").toLowerCase();
  const canEdit = userDept === "communication" || userDept === "iqac" || userDept === "system admin" || !userDept;

  useEffect(() => {
    const endformId = localStorage.getItem('endformId');
    const currentEventId = localStorage.getItem('currentEventId');
    const isEditMode = localStorage.getItem('isEditMode') === 'true';
    
    if (!endformId || !currentEventId) {
      dispatch(clearEventData());
      localStorage.removeItem('communicationFormId');
      localStorage.removeItem('communicationForm');
      // Also clear the form state
      setFormData({
        photography: false,
        videography: false,
      });
      setSelectedOptions({});
      setCommId('');
    }
  }, []);

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      const endformId = localStorage.getItem('endformId');
      const currentEventId = localStorage.getItem('currentEventId');
      if (!endformId || !currentEventId) {
        dispatch(clearEventData());
      }
    };
  }, []);

  useEffect(() => {
    // Check if there's an active event first
    const endformId = localStorage.getItem("endformId");
    const currentEventId = localStorage.getItem("currentEventId");
    const isEditMode = localStorage.getItem('isEditMode') === 'true';
    

    
    if (!currentEventId) {

      // For new event creation, start with empty form
      setFormData({
        photography: false,
        videography: false,
      });
      setSelectedOptions({});
      setCommId('');
      return;
    }
    
    // If we have an endformId OR isEditMode is true, this is an existing event being edited
    if (endformId || isEditMode) {

      // Check if we have communication form data in localStorage (set by Edit button)
      const storedCommunicationForm = localStorage.getItem('communicationForm');
      if (storedCommunicationForm) {
        try {
          console.log("CommunicationForm - Using stored communication form data from localStorage");
          const parsedCommData = JSON.parse(storedCommunicationForm);
          console.log("CommunicationForm - Parsed communication data:", parsedCommData);
          
          // Format the data to match our form structure
          setFormData({
            photography: parsedCommData.cameraAction?.photography || false,
            videography: parsedCommData.cameraAction?.videography || false,
          });
          setSelectedOptions({
            "Event Poster": parsedCommData.eventPoster || [],
            Videos: parsedCommData.videos || [],
            "On Stage Requirements": parsedCommData.onStageRequirements || [],
            "Flex Banners": parsedCommData.flexBanners || [],
            "Reception TV Streaming Requirements": parsedCommData.receptionTVStreamingRequirements || [],
            Communication: parsedCommData.communication || [],
          });
          setCommId(parsedCommData._id || '');
          return;
        } catch (error) {
          console.error("CommunicationForm - Error parsing stored communication form data:", error);
        }
      }

      const fetchAndPrefill = async () => {
        try {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/endform/${endformId}`);
          if (response.data && response.data.communicationform) {
            const commData = response.data.communicationform;

            setFormData({
              photography: commData.cameraAction?.photography || false,
              videography: commData.cameraAction?.videography || false,
            });
            setSelectedOptions({
              "Event Poster": commData.eventPoster || [],
              Videos: commData.videos || [],
              "On Stage Requirements": commData.onStageRequirements || [],
              "Flex Banners": commData.flexBanners || [],
              "Reception TV Streaming Requirements": commData.receptionTVStreamingRequirements || [],
              Communication: commData.communication || [],
            });
            setCommId(commData._id || '');
          } else {

            setCommId('');
          }
        } catch (err) {
          console.error("CommunicationForm - Error fetching data:", err);
          setCommId('');
        }
      };
      fetchAndPrefill();
    } else {
      // This is a new event creation - ensure form is empty
      console.log("CommunicationForm - New event creation, starting with empty form");
      setFormData({
        photography: false,
        videography: false,
      });
      setSelectedOptions({});
      setCommId('');
    }
  }, []);



  const categories = [
    {
      category: "Event Poster",
      options: [
        "Pre event Poster",
        "Chief Guest poster",
        "Event promotional poster",
        "Post event poster",
        "ID cards",
        "Plug cards",
      ],
    },
    {
      category: "Videos",
      options: [
        "Coming soon video",
        "Event Launch Video",
        "Promotional video",
        "Chief guest video",
        "Stage streaming video",
        "Event glimpses video",
        "Post event video",
      ],
    },
    {
      category: "On Stage Requirements",
      options: ["LED Backdrop", "Stage streaming video"],
    },
    {
      category: "Flex Banners",
      options: [
        "Front entrance banner",
        "Welcome banner",
        "Stage backdrop",
        "Event standee",
      ],
    },
    {
      category: "Reception TV Streaming Requirements",
      options: [
        "Event poster",
        "Chief guest welcome poster to TV",
        "Launch poster",
        "Thanksgiving",
      ],
    },
    {
      category: "Communication",
      options: [
        "Website (Pre / Day of the Event)",
        "Social Media (Pre / Day of the Event)",
      ],
    },
  ];

  const handleCheckboxChange = (category, option) => {
    setSelectedOptions((prev) => {
      const categoryOptions = prev?.[category] || [];
      const isSelected = categoryOptions.includes(option);

      return {
        ...prev,
        [category]: isSelected
          ? categoryOptions.filter((item) => item !== option)
          : [...categoryOptions, option],
      };
    });
  };

  const handleChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e) => {
    console.log("=== COMMUNICATION FORM SUBMIT CALLED ===");
    console.log("Form submitted, isEditMode:", isEditMode);
    console.log("canEdit:", canEdit);
    console.log("formData:", formData);
    console.log("selectedOptions:", selectedOptions);
    
    if (e && e.preventDefault) {
      e.preventDefault();
      console.log("preventDefault called");
    } else {
      console.log("No event object or preventDefault not available");
    }
    setIsLoading(true);
    try {
      // Format the data according to the backend schema
      const formattedData = {
        eventPoster: selectedOptions['Event Poster'] || [],
        videos: selectedOptions['Videos'] || [],
        onStageRequirements: selectedOptions['On Stage Requirements'] || [],
        flexBanners: selectedOptions['Flex Banners'] || [],
        receptionTVStreamingRequirements: selectedOptions['Reception TV Streaming Requirements'] || [],
        communication: selectedOptions['Communication'] || [],
        cameraAction: {
          photography: formData.photography,
          videography: formData.videography
        }
      };
      let url;
      let idToUse = commId;
      let commIdResp;
      if (isEditMode) {
        // Use commId from state only
        console.log('[DEBUG] Communication form ID for update:', idToUse);
        if (!idToUse) {
          toast.error('Communication form ID not found. Please refresh the page or contact support.');
          setIsLoading(false);
          return;
        }
        url = `${import.meta.env.VITE_API_URL}/media/${idToUse}`;
        const response = await axios({
          method: "PUT",
          url,
          data: formattedData,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        commIdResp = response.data?.requirement?._id || response.data?._id || response.data?.id;
      } else {
        // CREATE new MediaRequirements
        url = `${import.meta.env.VITE_API_URL}/media`;
        const response = await axios({
          method: "POST",
          url,
          data: formattedData,
          headers: { 'Content-Type': 'application/json' }
        });
        commIdResp = response.data?.requirement?._id || response.data?._id || response.data?.id;
      }
      if (commIdResp) {
        localStorage.setItem('communicationForm', JSON.stringify({ objectId: commIdResp }));
        localStorage.setItem('communicationFormId', commIdResp);
        setCommId(commIdResp);
        console.log('Saved communicationFormId to localStorage:', commIdResp);
      } else {
        console.error('No communication subFormId after creation!');
      }
      
      // Only try to update End Form if it exists (for existing events)
      const endformId = localStorage.getItem('endformId');
      if (commIdResp && endformId) {
        console.log('About to PUT to Endform:', { endformId, commIdResp });
        try {
          await axios.put(
            `${import.meta.env.VITE_API_URL}/endform/${endformId}`,
            { communicationform: commIdResp },
            { headers: { 'Content-Type': 'application/json' } }
          );
          console.log('Successfully updated End Form with communication ID');
        } catch (err) {
          console.error('Failed to update Endform with communication ID:', err);
          // Don't show error toast for new events - this is expected
          if (endformId) {
            toast.error('Failed to link communication form to event. Please contact support if this persists.');
          }
        }
      } else {
        if (!commIdResp) {
          console.error('No communication subFormId after creation!');
        }
        if (!endformId) {
          console.log('No endformId in localStorage - this is expected for new events');
        }
      }
      // Always try to update the main event with the new communicationform ID
      const eventId = localStorage.getItem("currentEventId");
      console.log("CommunicationForm - Retrieved eventId from localStorage:", eventId);
      console.log("CommunicationForm - commIdResp:", commIdResp);
      console.log("CommunicationForm - All localStorage keys:", Object.keys(localStorage));
      
      if (commIdResp && eventId) {
        // Check if eventId is a valid MongoDB ObjectId (24 hex characters)
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(eventId);
        if (!isValidObjectId) {
          console.error('Invalid event ID format:', eventId);
          toast.error('Invalid event ID. Please start from the Basic Event form.');
          return;
        }
        
        try {
          await axios.put(
            `${import.meta.env.VITE_API_URL}/event/${eventId}`,
            { communicationform: commIdResp },
            { headers: { 'Content-Type': 'application/json' } }
          );
        } catch (err) {
          console.error('Error updating main event:', err);
          toast.error('Failed to link communication form to main event. Please contact support if this persists.');
        }
      } else if (!eventId) {
        console.error('No event ID found in localStorage');
        toast.error('No event ID found. Please start from the Basic Event form and create an event first.');
        return;
      }
      toast.success(
        isEditMode
          ? "Communication form updated successfully"
          : "Communication form saved successfully"
      );
      
      console.log("CommunicationForm - Form submission successful, about to navigate");
      
      // Always fetch latest event data and update Redux after update/create
      if (eventId) {
        try {
          const eventResponse = await axios.get(`${import.meta.env.VITE_API_URL}/event/${eventId}`);
          if (eventResponse.data) {
            dispatch(setEventData(eventResponse.data));
          }
        } catch (err) {
          console.error("Error fetching event data:", err);
        }
      }
      
      if (nextForm) {
        console.log("Navigating to next form:", nextForm);
        setIsFormEditable(false);
        setOriginalFormData(null);
        try {
          navigate(nextForm);
          console.log("Navigate to nextForm completed");
        } catch (navError) {
          console.error("Navigation error:", navError);
        }
      } else {
        console.log("Navigating to transport form");
        console.log("About to call navigate('/forms/transport')");
        setIsFormEditable(false);
        setOriginalFormData(null);
        try {
          navigate("/forms/transport");
          console.log("Navigate call completed");
        } catch (navError) {
          console.error("Navigation error:", navError);
        }
      }
    } catch (error) {
      toast.error("Failed to save form. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  
  return (
    <div className="relative w-full">
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 shadow-lg z-50">
          <div className="h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <div className="w-full">
        <form
          onSubmit={handleSubmit}
          className="w-full p-4 md:p-6"
        >
          <div className="mb-6 rounded-xl bg-violet-100/70 px-4 py-3 text-sm font-medium text-violet-800">
            Form 2: Communication & Media
          </div>
          <h1 className="mb-6 text-start text-2xl font-bold text-slate-800 md:text-3xl">
            Communication and Media {isEditMode ? "(Edit Mode)" : ""}
          </h1>
          <div className="mb-6 flex flex-col gap-3 text-base font-semibold text-gray-700 md:text-lg">
            <label className="inline-flex ml-4 items-center">
              <input
                type="checkbox"
                name="photography"
                checked={formData.photography}
                onChange={handleChange}
                className="mt-0.5 h-4 w-4 shrink-0 align-top text-blue-600 border-gray-300 rounded"
                disabled={!canEdit || !isFormEditable}
              />
              <span className="ml-2 text-gray-700 leading-6">
                Request for Photography on the day of the event
              </span>
            </label>
            <label className="inline-flex ml-4 items-center">
              <input
                type="checkbox"
                name="videography"
                checked={formData.videography}
                onChange={handleChange}
                className="mt-0.5 h-4 w-4 shrink-0 align-top text-blue-600 border-gray-300 rounded"
                disabled={!canEdit || !isFormEditable}
              />
              <span className="ml-2 text-gray-700 leading-6">
                Request for Videography on the day of the event
              </span>
            </label>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {categories.map((category, idx) => (
              <div key={idx} className="rounded-xl border border-violet-900/10 bg-violet-50/50 p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-violet-900">
                  {category.category}
                </h2>
                <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                  {category.options.map((option, index) => (
                    <label
                      key={index}
                      className="flex min-h-[88px] cursor-pointer items-start gap-2 rounded-lg border border-violet-900/10 bg-white p-3.5 transition hover:bg-violet-50"
                    >
                      <input
                        type="checkbox"
                        value={option}
                        onChange={() =>
                          handleCheckboxChange(category.category, option)
                        }
                        checked={
                          selectedOptions[category.category]?.includes(
                            option
                          ) || false
                        }
                        className="mt-1 h-4 w-4 shrink-0 align-top text-blue-600 border-gray-300 rounded"
                        disabled={!canEdit || !isFormEditable}
                      />
                      <span className="block w-full whitespace-normal break-words text-sm text-gray-800 leading-6">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-end gap-3">
            {isEditMode && !isFormEditable ? (
              <button
                type="button"
                onClick={handleEditToggle}
                className="h-10 rounded-md bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Edit Form
              </button>
            ) : isFormEditable ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="h-10 rounded-md border border-gray-300 px-6 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 rounded-md bg-violet-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                  disabled={!canEdit}
                >
                  Save and Go Next
                </button>
              </>
            ) : (
              <button
                type="submit"
                className="h-10 rounded-md bg-violet-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                disabled={!canEdit}
              >
                Save and Go Next
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommunicationForm;