const Measures = require('../models/measures.model');

const getMeasures = async (req, res) => {
    try {
        const measures = await Measures.find();
        res.status(200).json(measures);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}
const getMeasuresById = async (req, res) => {
    try {
        const { id } = req.params;
        const measure = await Measures.findById(id);
        res.status(200).json(measure);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const createMeasures = async (req, res) => {
    try {
        const measure = await Measures.create(req.body);
        res.status(200).json(measure);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const saveMeasures = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        // const { Measures } = req.body;

        // // Validate data
        // if (typeof straightLineDistance !== 'number') {
        //     return res.status(400).send('Invalid input data');
        // }

        const newTask = new Measures(req.body);
        await newTask.save();
        res.status(201).send('Data saved successfully');
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).send('Internal Server Error');
    }
};

const updateMeasures = async (req, res) => {
    try {
        const { id } = req.params;
        const measure = await Measures.findByIdAndUpdate(id, req.body);

        if (!measure) {
            return res.status(404).json({ message: 'Measure not found' });
        };

        const updatedMeasure = await Measures.findById(id);
        res.status(200).json(updatedMeasure);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}
const deleteMeasures = async (req, res) => {

    try {
        const { id } = req.params;
        const measure = await Measures.findByIdAndDelete(id);

        if (!measure) {
            return res.status(404).json({ message: 'Measure not found' });
        };

        res.status(200).json({ message: 'Measure deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}


module.exports = {
    getMeasures,
    getMeasuresById,
    createMeasures,
    updateMeasures,
    deleteMeasures,
    saveMeasures
};
